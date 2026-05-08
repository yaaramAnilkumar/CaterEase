from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from app.db.session import get_db
from app.models.user import User
from app.models.menu import Dish, ServiceType, Package
from app.models.order import Order, OrderDish, OrderStatus
from app.models.location import Address
from app.models.review import Review
from app.models.promo_code import PromoCode
from app.models.audit_log import AuditLog
from app.schemas.order import OrderCreate, OrderOut, OrderStatusUpdate
from app.schemas.menu import ReviewCreate, ReviewOut
from app.routers.deps import get_current_user, require_admin
from app.routers.promo import _validate_promo
from app.core.config import settings

router = APIRouter(prefix="/orders", tags=["orders"])


def calculate_total(dishes: list, guest_count: int, package_price: float = 0) -> tuple[float, float]:
    dishes_total = sum(d["price"] * d["qty"] * guest_count for d in dishes)
    subtotal = dishes_total + (package_price * guest_count)
    discount = subtotal * (settings.DISCOUNT_PERCENT / 100) if guest_count >= settings.DISCOUNT_THRESHOLD_GUESTS else 0
    total = subtotal - discount
    return subtotal, total


@router.post("/", response_model=OrderOut, status_code=201)
def create_order(payload: OrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    address = db.query(Address).filter(Address.id == payload.delivery_address_id, Address.user_id == current_user.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    service_type = db.query(ServiceType).filter(ServiceType.id == payload.service_type_id).first()
    if not service_type:
        raise HTTPException(status_code=404, detail="Service type not found")

    dish_data = []
    for item in payload.dishes:
        dish = db.query(Dish).filter(Dish.id == item.dish_id, Dish.is_available == True).first()
        if not dish:
            raise HTTPException(status_code=404, detail=f"Dish {item.dish_id} not found")
        dish_data.append({"dish": dish, "qty": item.quantity, "price": dish.price_per_head})

    package_price = 0
    if payload.package_id:
        pkg = db.query(Package).filter(Package.id == payload.package_id).first()
        if pkg:
            package_price = pkg.base_price_per_head

    subtotal, total = calculate_total(
        [{"price": d["price"], "qty": d["qty"]} for d in dish_data],
        payload.guest_count,
        package_price,
    )
    guest_discount = subtotal - total  # amount saved by guest count threshold

    # Corporate discount
    corp_discount = 0.0
    if current_user.is_corporate and current_user.corporate_discount > 0:
        corp_discount = round(subtotal * current_user.corporate_discount / 100, 2)

    # Promo code
    promo = None
    promo_discount = 0.0
    if payload.promo_code:
        promo = db.query(PromoCode).filter(PromoCode.code == payload.promo_code.strip().upper()).first()
        valid, message, promo_discount = _validate_promo(promo, subtotal)
        if not valid:
            raise HTTPException(status_code=400, detail=message)

    # Loyalty points redemption
    points_redeemed = 0
    points_discount = 0.0
    if payload.redeem_points and current_user.loyalty_points > 0:
        max_discount = subtotal - guest_discount - corp_discount - promo_discount
        points_discount = min(
            round(current_user.loyalty_points * settings.POINTS_RUPEE_VALUE, 2),
            max(0, max_discount),
        )
        points_redeemed = int(points_discount / settings.POINTS_RUPEE_VALUE)

    final_total = max(0, subtotal - guest_discount - corp_discount - promo_discount - points_discount)

    # Points earned on this order (awarded after payment)
    points_earned = int(final_total / 100) * settings.POINTS_PER_HUNDRED

    order = Order(
        user_id=current_user.id,
        service_type_id=payload.service_type_id,
        package_id=payload.package_id,
        event_type=payload.event_type,
        guest_count=payload.guest_count,
        event_date=payload.event_date,
        event_time=payload.event_time,
        delivery_address_id=payload.delivery_address_id,
        special_instructions=payload.special_instructions,
        subtotal=subtotal,
        discount=guest_discount + corp_discount,
        promo_code_id=promo.id if promo else None,
        promo_discount=promo_discount,
        points_redeemed=points_redeemed,
        points_discount=points_discount,
        points_earned=points_earned,
        total_amount=final_total,
    )
    db.add(order)
    db.flush()

    for item in dish_data:
        od = OrderDish(
            order_id=order.id,
            dish_id=item["dish"].id,
            quantity=item["qty"],
            unit_price=item["dish"].price_per_head,
        )
        db.add(od)

    if promo:
        promo.used_count += 1
    if points_redeemed > 0:
        current_user.loyalty_points -= points_redeemed

    db.commit()
    db.refresh(order)
    return order


@router.get("/", response_model=List[OrderOut])
def list_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# Admin: update order status
@router.put("/{order_id}/status", response_model=OrderOut)
def update_order_status(order_id: int, payload: OrderStatusUpdate, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    old_status = order.status.value
    order.status = payload.status
    db.add(AuditLog(
        admin_id=current_admin.id,
        action="order_status_changed",
        entity_type="order",
        entity_id=order_id,
        detail=f"{old_status} → {payload.status.value}",
    ))
    db.commit()
    db.refresh(order)
    try:
        from app.services.push_service import send_order_status_push
        send_order_status_push(db, order.id, payload.status.value)
    except Exception:
        pass
    return order


@router.post("/{order_id}/review", response_model=ReviewOut)
def submit_review(order_id: int, payload: ReviewCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != OrderStatus.delivered:
        raise HTTPException(status_code=400, detail="You can only review a delivered order")
    if db.query(Review).filter(Review.order_id == order_id).first():
        raise HTTPException(status_code=400, detail="You have already reviewed this order")
    if not (1 <= payload.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    dish = db.query(Dish).filter(Dish.id == payload.dish_id).first()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
    review = Review(order_id=order_id, user_id=current_user.id, dish_id=payload.dish_id, rating=payload.rating, comment=payload.comment)
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get("/{order_id}/review", response_model=ReviewOut)
def get_review(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.order_id == order_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="No review for this order")
    return review


# Admin: list all orders with optional filters + search
@router.get("/admin/all", dependencies=[Depends(require_admin)])
def admin_list_orders(
    status: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Order).options(joinedload(Order.user)).order_by(Order.created_at.desc())
    if status:
        q = q.filter(Order.status == status)
    if date_from:
        q = q.filter(Order.event_date >= date_from)
    if date_to:
        q = q.filter(Order.event_date <= date_to)
    if search:
        search = search.strip()
        if search.lstrip("#").isdigit():
            q = q.filter(Order.id == int(search.lstrip("#")))
        else:
            q = q.join(Order.user).filter(User.name.ilike(f"%{search}%"))
    orders = q.all()
    result = []
    for o in orders:
        d = OrderOut.model_validate(o).model_dump()
        d["customer_name"] = o.user.name if o.user else None
        d["customer_phone"] = o.user.phone if o.user else None
        result.append(d)
    return result
