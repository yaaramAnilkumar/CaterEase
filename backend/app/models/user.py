from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import secrets
from app.db.base import Base


def _gen_referral_code() -> str:
    return secrets.token_hex(4).upper()  # e.g. "A3F9C21B"


class UserRole(str, enum.Enum):
    customer = "customer"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(15), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.customer, nullable=False)
    is_active = Column(Boolean, default=True)
    is_corporate = Column(Boolean, default=False)
    corporate_discount = Column(Integer, default=0)  # percent
    loyalty_points = Column(Integer, default=0)
    referral_code = Column(String(16), unique=True, default=_gen_referral_code)
    referred_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user")
    recurring_orders = relationship("RecurringOrder", back_populates="user", cascade="all, delete-orphan")
    push_subscriptions = relationship("PushSubscription", back_populates=None, cascade="all, delete-orphan", foreign_keys="PushSubscription.user_id")
