from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class BlockedDate(Base):
    __tablename__ = "blocked_dates"

    id = Column(Integer, primary_key=True, index=True)
    blocked_date = Column(Date, unique=True, nullable=False)
    reason = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
