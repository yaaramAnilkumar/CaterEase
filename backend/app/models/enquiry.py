from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Enum as SAEnum
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class EnquiryStatus(str, enum.Enum):
    new = "New"
    contacted = "Contacted"
    closed = "Closed"


class Enquiry(Base):
    __tablename__ = "enquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    event_type = Column(String, nullable=False)
    guest_count = Column(Integer, nullable=False)
    event_date = Column(Date, nullable=True)
    message = Column(Text, nullable=True)
    status = Column(SAEnum(EnquiryStatus), default=EnquiryStatus.new, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
