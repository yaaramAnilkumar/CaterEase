import razorpay
import hmac
import hashlib
import uuid
from app.core.config import settings

DEV_MODE = not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET

if not DEV_MODE:
    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def create_razorpay_order(amount_inr: float, receipt: str) -> dict:
    if DEV_MODE:
        # Mock order for development — no real API call
        return {
            "id": f"mock_order_{uuid.uuid4().hex[:12]}",
            "amount": int(amount_inr * 100),
            "currency": "INR",
            "receipt": receipt,
        }
    amount_paise = int(amount_inr * 100)
    return client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "receipt": receipt,
    })


def verify_payment_signature(razorpay_order_id: str, razorpay_payment_id: str, signature: str) -> bool:
    # Mock orders auto-verify in dev mode
    if razorpay_order_id.startswith("mock_order_"):
        return True
    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def is_dev_mode() -> bool:
    return DEV_MODE
