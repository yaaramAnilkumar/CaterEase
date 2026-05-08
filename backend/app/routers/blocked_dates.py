from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.models.blocked_date import BlockedDate
from app.routers.deps import require_admin

router = APIRouter(prefix="/blocked-dates", tags=["blocked-dates"])


class BlockedDateIn(BaseModel):
    blocked_date: date
    reason: Optional[str] = None


@router.get("/")
def list_blocked_dates(db: Session = Depends(get_db)):
    rows = db.query(BlockedDate).order_by(BlockedDate.blocked_date).all()
    return [{"id": r.id, "date": r.blocked_date.isoformat(), "reason": r.reason} for r in rows]


@router.post("/admin", dependencies=[Depends(require_admin)], status_code=201)
def add_blocked_date(payload: BlockedDateIn, db: Session = Depends(get_db)):
    if db.query(BlockedDate).filter(BlockedDate.blocked_date == payload.blocked_date).first():
        raise HTTPException(status_code=400, detail="Date already blocked")
    entry = BlockedDate(blocked_date=payload.blocked_date, reason=payload.reason)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"id": entry.id, "date": entry.blocked_date.isoformat(), "reason": entry.reason}


@router.delete("/admin/{entry_id}", dependencies=[Depends(require_admin)])
def remove_blocked_date(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(BlockedDate).filter(BlockedDate.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(entry)
    db.commit()
    return {"detail": "Removed"}
