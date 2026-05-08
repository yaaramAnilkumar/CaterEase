import json
import base64
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


def _is_configured() -> bool:
    return bool(settings.VAPID_PUBLIC_KEY and settings.VAPID_PRIVATE_KEY_B64)


def send_push(subscription_info: dict, title: str, body: str, url: str = "/orders") -> bool:
    """Send a Web Push notification. Returns True on success."""
    if not _is_configured():
        logger.info(f"[DEV] Push notification: {title} — {body}")
        return True
    try:
        from pywebpush import webpush, WebPushException
        private_key_pem = base64.b64decode(settings.VAPID_PRIVATE_KEY_B64).decode()
        webpush(
            subscription_info=subscription_info,
            data=json.dumps({"title": title, "body": body, "url": url}),
            vapid_private_key=private_key_pem,
            vapid_claims={"sub": f"mailto:{settings.VAPID_EMAIL}"},
        )
        return True
    except Exception as e:
        logger.warning(f"Push notification failed: {e}")
        return False


def send_order_status_push(db, order_id: int, new_status: str):
    """Send push notification to all subscriptions for the order's user."""
    if not _is_configured():
        logger.info(f"[DEV] Order #{order_id} status push: {new_status}")
        return
    from app.models.push_subscription import PushSubscription
    from app.models.order import Order
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return
    subs = db.query(PushSubscription).filter(PushSubscription.user_id == order.user_id).all()
    messages = {
        "Confirmed": ("Order Confirmed!", f"Order #{order_id} has been confirmed and is being prepared."),
        "Preparing": ("Kitchen Update", f"Order #{order_id} is now being prepared."),
        "Out for Delivery": ("On the Way!", f"Order #{order_id} is out for delivery."),
        "Delivered": ("Delivered!", f"Order #{order_id} has been delivered. Enjoy your meal!"),
        "Cancelled": ("Order Cancelled", f"Order #{order_id} has been cancelled."),
    }
    title, body = messages.get(new_status, ("Order Update", f"Order #{order_id}: {new_status}"))
    for sub in subs:
        subscription_info = {
            "endpoint": sub.endpoint,
            "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
        }
        send_push(subscription_info, title, body, f"/orders/{order_id}")
