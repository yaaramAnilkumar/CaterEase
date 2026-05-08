from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class EnquiryCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    event_type: str
    guest_count: int
    event_date: Optional[date] = None
    message: Optional[str] = None


class EnquiryStatusUpdate(BaseModel):
    status: str  # New | Contacted | Closed


class EnquiryOut(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str]
    event_type: str
    guest_count: int
    event_date: Optional[date]
    message: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
