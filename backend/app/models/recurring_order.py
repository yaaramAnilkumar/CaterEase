from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Date, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class Frequency(str, enum.Enum):
    weekly = "Weekly"
    biweekly = "Biweekly"
    monthly = "Monthly"


class RecurringOrder(Base):
    __tablename__ = "recurring_orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    label = Column(String, nullable=False)
    service_type_id = Column(Integer, ForeignKey("service_types.id"), nullable=False)
    event_type = Column(String, nullable=False)
    guest_count = Column(Integer, nullable=False)
    delivery_address_id = Column(Integer, ForeignKey("addresses.id"), nullable=False)
    special_instructions = Column(Text, nullable=True)
    dishes_json = Column(Text, nullable=False)  # JSON: [{dish_id, quantity}]
    frequency = Column(SAEnum(Frequency), nullable=False)
    next_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="recurring_orders")
    service_type = relationship("ServiceType")
    delivery_address = relationship("Address")
