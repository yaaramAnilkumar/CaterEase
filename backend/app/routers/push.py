from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.models.user import User
from app.models.push_subscription import PushSubscription
from app.routers.deps import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/push", tags=["push"])


class SubscribeRequest(BaseModel):
    endpoint: str
    p256dh: str
    auth: str


@router.get("/vapid-public-key")
def get_vapid_key():
    return {"public_key": settings.VAPID_PUBLIC_KEY or ""}


@router.post("/subscribe", status_code=201)
def subscribe(payload: SubscribeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(PushSubscription).filter(PushSubscription.endpoint == payload.endpoint).first()
    if existing:
        # Update keys in case they changed
        existing.p256dh = payload.p256dh
        existing.auth = payload.auth
        existing.user_id = current_user.id
        db.commit()
        return {"detail": "Subscription updated"}
    sub = PushSubscription(
        user_id=current_user.id,
        endpoint=payload.endpoint,
        p256dh=payload.p256dh,
        auth=payload.auth,
    )
    db.add(sub)
    db.commit()
    return {"detail": "Subscribed successfully"}


@router.delete("/unsubscribe")
def unsubscribe(payload: SubscribeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sub = db.query(PushSubscription).filter(
        PushSubscription.endpoint == payload.endpoint,
        PushSubscription.user_id == current_user.id,
    ).first()
    if sub:
        db.delete(sub)
        db.commit()
    return {"detail": "Unsubscribed"}
