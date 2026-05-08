from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.user import User
from app.models.location import Address
from app.schemas.user import AddressCreate, AddressOut, UserOut, CorporateUpdate, UpdateProfile, ChangePasswordRequest
from app.core.security import verify_password, hash_password
from app.routers.deps import get_current_user, require_admin

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_profile(payload: UpdateProfile, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.name is not None:
        current_user.name = payload.name.strip()
    if payload.phone is not None:
        existing = db.query(User).filter(User.phone == payload.phone, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone already in use")
        current_user.phone = payload.phone
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/change-password", status_code=200)
def change_password(payload: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"detail": "Password changed successfully"}


@router.get("/me/referral")
def my_referral(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    referred_count = db.query(User).filter(User.referred_by_id == current_user.id).count()
    return {
        "referral_code": current_user.referral_code,
        "referred_count": referred_count,
        "points_per_referral": 100,
        "share_text": f"Use my code {current_user.referral_code} on CaterEase and get 50 loyalty points on your first order!",
    }


@router.get("/me/addresses", response_model=List[AddressOut])
def list_addresses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Address).filter(Address.user_id == current_user.id).all()


@router.post("/me/addresses", response_model=AddressOut, status_code=201)
def add_address(payload: AddressCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.is_default:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})
    address = Address(user_id=current_user.id, **payload.model_dump())
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.delete("/me/addresses/{address_id}")
def delete_address(address_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    db.delete(address)
    db.commit()
    return {"detail": "Address deleted"}


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("/admin", response_model=List[UserOut], dependencies=[Depends(require_admin)])
def admin_list_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch("/admin/{user_id}/corporate", response_model=UserOut, dependencies=[Depends(require_admin)])
def set_corporate(user_id: int, payload: CorporateUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not 0 <= payload.corporate_discount <= 50:
        raise HTTPException(status_code=400, detail="Discount must be between 0 and 50%")
    user.is_corporate = payload.is_corporate
    user.corporate_discount = payload.corporate_discount if payload.is_corporate else 0
    db.commit()
    db.refresh(user)
    return user
