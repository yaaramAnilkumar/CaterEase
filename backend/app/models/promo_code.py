from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum as SAEnum, Text
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class DiscountType(str, enum.Enum):
    percent = "percent"
    flat = "flat"


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    discount_type = Column(SAEnum(DiscountType), nullable=False)
    discount_value = Column(Float, nullable=False)
    min_order_amount = Column(Float, default=0)
    max_uses = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
