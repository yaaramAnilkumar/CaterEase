import hmac
import hashlib
import json
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.order import Order, OrderStatus
from app.models.payment import Payment, PaymentStatus
from app.schemas.payment import PaymentCreate, PaymentOut, PaymentVerify
from app.routers.deps import get_current_user
from app.services.razorpay_service import create_razorpay_order, verify_payment_signature, is_dev_mode
from app.services.email_service import send_order_confirmation_email
from app.core.config import settings

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/create")
def create_payment(payload: PaymentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == payload.order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.payment:
        raise HTTPException(status_code=400, detail="Payment already initiated")

    rz_order = create_razorpay_order(order.total_amount, f"order_{order.id}")
    payment = Payment(
        order_id=order.id,
        razorpay_order_id=rz_order["id"],
        amount=order.total_amount,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "id": payment.id,
        "order_id": payment.order_id,
        "razorpay_order_id": payment.razorpay_order_id,
        "amount": payment.amount,
        "currency": payment.currency,
        "status": payment.status,
        "is_mock": is_dev_mode(),
    }


@router.post("/verify")
def verify_payment(payload: PaymentVerify, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    payment = db.query(Payment).filter(Payment.razorpay_order_id == payload.razorpay_order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if not verify_payment_signature(payload.razorpay_order_id, payload.razorpay_payment_id, payload.razorpay_signature):
        payment.status = PaymentStatus.failed
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    payment.razorpay_payment_id = payload.razorpay_payment_id
    payment.razorpay_signature = payload.razorpay_signature
    payment.status = PaymentStatus.paid
    order = payment.order
    order.status = OrderStatus.confirmed

    # Award loyalty points to the user
    if order.points_earned > 0:
        order.user.loyalty_points += order.points_earned

    db.commit()

    try:
        send_order_confirmation_email(
            to_email=order.user.email,
            customer_name=order.user.name,
            order_id=order.id,
            event_type=order.event_type.value if hasattr(order.event_type, "value") else str(order.event_type),
            event_date=order.event_date,
            guest_count=order.guest_count,
            total_amount=order.total_amount,
        )
    except Exception:
        pass  # never fail payment confirmation due to email

    return {"detail": "Payment verified successfully", "order_id": payment.order_id}


@router.post("/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.body()

    if settings.RAZORPAY_WEBHOOK_SECRET:
        sig = request.headers.get("X-Razorpay-Signature", "")
        expected = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode(),
            body,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, sig):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        data = json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event = data.get("event", "")
    if event == "payment.captured":
        entity = data.get("payload", {}).get("payment", {}).get("entity", {})
        rz_order_id = entity.get("order_id")
        rz_payment_id = entity.get("id")
        if rz_order_id:
            payment = db.query(Payment).filter(Payment.razorpay_order_id == rz_order_id).first()
            if payment and payment.status != PaymentStatus.paid:
                payment.razorpay_payment_id = rz_payment_id
                payment.status = PaymentStatus.paid
                order = payment.order
                order.status = OrderStatus.confirmed
                if order.points_earned > 0:
                    order.user.loyalty_points += order.points_earned
                db.commit()
                try:
                    send_order_confirmation_email(
                        to_email=order.user.email,
                        customer_name=order.user.name,
                        order_id=order.id,
                        event_type=order.event_type.value if hasattr(order.event_type, "value") else str(order.event_type),
                        event_date=order.event_date,
                        guest_count=order.guest_count,
                        total_amount=order.total_amount,
                    )
                except Exception:
                    pass

    return {"status": "ok"}
