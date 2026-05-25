from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class ChatLead(Base):
    __tablename__ = "chat_leads"

    id          = Column(Integer, primary_key=True, index=True)
    session_id  = Column(String(100), unique=True, index=True, nullable=False)

    # Contact info
    name        = Column(String(100), nullable=True)
    phone       = Column(String(20),  nullable=True)
    email       = Column(String(100), nullable=True)

    # Event details
    event_type  = Column(String(50),  nullable=True)   # Wedding, Birthday, Corporate …
    event_date  = Column(String(30),  nullable=True)   # stored as string e.g. "2025-12-20"
    guest_count = Column(Integer,     nullable=True)
    city        = Column(String(50),  nullable=True)
    budget      = Column(String(50),  nullable=True)   # e.g. "₹50,000–₹1,00,000"

    # Sales stage
    stage       = Column(String(30),  nullable=True, default="new")  # new/qualified/quote/booking

    notes       = Column(Text,        nullable=True)

    created_at  = Column(DateTime, server_default=func.now())
    updated_at  = Column(DateTime, server_default=func.now(), onupdate=func.now())
