import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.user import User
from app.models.recurring_order import RecurringOrder, Frequency
from app.models.location import Address
from app.schemas.recurring import RecurringOrderCreate, RecurringOrderOut
from app.routers.deps import get_current_user, require_admin

router = APIRouter(prefix="/recurring", tags=["recurring"])


@router.post("/", response_model=RecurringOrderOut, status_code=201)
def create_recurring(payload: RecurringOrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    address = db.query(Address).filter(Address.id == payload.delivery_address_id, Address.user_id == current_user.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    try:
        frequency = Frequency(payload.frequency)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid frequency")
    if not payload.dishes:
        raise HTTPException(status_code=400, detail="At least one dish is required")
    ro = RecurringOrder(
        user_id=current_user.id,
        label=payload.label.strip(),
        service_type_id=payload.service_type_id,
        event_type=payload.event_type,
        guest_count=payload.guest_count,
        delivery_address_id=payload.delivery_address_id,
        special_instructions=payload.special_instructions,
        dishes_json=json.dumps([d.model_dump() for d in payload.dishes]),
        frequency=frequency,
        next_date=payload.next_date,
    )
    db.add(ro)
    db.commit()
    db.refresh(ro)
    return ro


@router.get("/", response_model=List[RecurringOrderOut])
def list_recurring(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(RecurringOrder).filter(RecurringOrder.user_id == current_user.id).order_by(RecurringOrder.created_at.desc()).all()


@router.patch("/{rid}/toggle", response_model=RecurringOrderOut)
def toggle_recurring(rid: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ro = db.query(RecurringOrder).filter(RecurringOrder.id == rid, RecurringOrder.user_id == current_user.id).first()
    if not ro:
        raise HTTPException(status_code=404, detail="Recurring order not found")
    ro.is_active = not ro.is_active
    db.commit()
    db.refresh(ro)
    return ro


@router.delete("/{rid}", status_code=204)
def delete_recurring(rid: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ro = db.query(RecurringOrder).filter(RecurringOrder.id == rid, RecurringOrder.user_id == current_user.id).first()
    if not ro:
        raise HTTPException(status_code=404, detail="Recurring order not found")
    db.delete(ro)
    db.commit()


@router.get("/admin/all", response_model=List[RecurringOrderOut], dependencies=[Depends(require_admin)])
def admin_list_recurring(db: Session = Depends(get_db)):
    return db.query(RecurringOrder).order_by(RecurringOrder.next_date).all()
