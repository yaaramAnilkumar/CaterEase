from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from app.db.session import get_db
from app.models.user import User
from app.models.promo_code import PromoCode, DiscountType
from app.routers.deps import get_current_user, require_admin
from app.schemas.promo import ValidatePromoRequest, ValidatePromoResponse, PromoCodeCreate, PromoCodeOut

router = APIRouter(prefix="/promo", tags=["promo"])


def _compute_discount(promo: PromoCode, order_amount: float) -> float:
    if promo.discount_type == DiscountType.percent:
        return round(order_amount * promo.discount_value / 100, 2)
    return min(promo.discount_value, order_amount)


def _validate_promo(promo: PromoCode | None, order_amount: float) -> tuple[bool, str, float]:
    if not promo or not promo.is_active:
        return False, "Invalid or expired promo code", 0
    if promo.max_uses is not None and promo.used_count >= promo.max_uses:
        return False, "This promo code has reached its usage limit", 0
    if promo.expires_at and promo.expires_at < datetime.now(timezone.utc):
        return False, "This promo code has expired", 0
    if order_amount < promo.min_order_amount:
        from app.core.config import settings
        currency = settings.CURRENCY
        return False, f"Minimum order amount of {currency} {promo.min_order_amount:.0f} required", 0
    discount = _compute_discount(promo, order_amount)
    return True, "Promo code applied successfully", discount


@router.post("/validate", response_model=ValidatePromoResponse)
def validate_promo(
    payload: ValidatePromoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    promo = db.query(PromoCode).filter(PromoCode.code == payload.code.strip().upper()).first()
    valid, message, discount_amount = _validate_promo(promo, payload.order_amount)
    if not valid:
        return ValidatePromoResponse(valid=False, message=message)
    return ValidatePromoResponse(
        valid=True,
        discount_type=promo.discount_type.value,
        discount_value=promo.discount_value,
        discount_amount=discount_amount,
        message=message,
    )


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("/admin", response_model=List[PromoCodeOut], dependencies=[Depends(require_admin)])
def list_promos(db: Session = Depends(get_db)):
    return db.query(PromoCode).order_by(PromoCode.created_at.desc()).all()


@router.post("/admin", response_model=PromoCodeOut, status_code=201, dependencies=[Depends(require_admin)])
def create_promo(payload: PromoCodeCreate, db: Session = Depends(get_db)):
    if db.query(PromoCode).filter(PromoCode.code == payload.code).first():
        raise HTTPException(status_code=400, detail="Promo code already exists")
    if payload.discount_type == "percent" and payload.discount_value > 100:
        raise HTTPException(status_code=400, detail="Percentage discount cannot exceed 100")
    promo = PromoCode(**payload.model_dump())
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo


@router.patch("/admin/{promo_id}/toggle", response_model=PromoCodeOut, dependencies=[Depends(require_admin)])
def toggle_promo(promo_id: int, db: Session = Depends(get_db)):
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promo code not found")
    promo.is_active = not promo.is_active
    db.commit()
    db.refresh(promo)
    return promo


@router.delete("/admin/{promo_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_promo(promo_id: int, db: Session = Depends(get_db)):
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promo code not found")
    db.delete(promo)
    db.commit()
