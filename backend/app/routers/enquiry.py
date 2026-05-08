from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.enquiry import Enquiry, EnquiryStatus
from app.schemas.enquiry import EnquiryCreate, EnquiryOut, EnquiryStatusUpdate
from app.routers.deps import require_admin

router = APIRouter(prefix="/enquiries", tags=["enquiries"])


@router.post("/", response_model=EnquiryOut, status_code=201)
def create_enquiry(payload: EnquiryCreate, db: Session = Depends(get_db)):
    if not payload.name.strip() or not payload.phone.strip():
        raise HTTPException(status_code=400, detail="Name and phone are required")
    if payload.guest_count < 1:
        raise HTTPException(status_code=400, detail="Guest count must be at least 1")
    enquiry = Enquiry(**payload.model_dump())
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    return enquiry


@router.get("/admin", response_model=List[EnquiryOut], dependencies=[Depends(require_admin)])
def list_enquiries(db: Session = Depends(get_db)):
    return db.query(Enquiry).order_by(Enquiry.created_at.desc()).all()


@router.patch("/admin/{enquiry_id}/status", response_model=EnquiryOut, dependencies=[Depends(require_admin)])
def update_enquiry_status(enquiry_id: int, payload: EnquiryStatusUpdate, db: Session = Depends(get_db)):
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    try:
        enquiry.status = EnquiryStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")
    db.commit()
    db.refresh(enquiry)
    return enquiry
