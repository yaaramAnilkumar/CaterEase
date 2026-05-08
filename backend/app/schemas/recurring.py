from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class RecurringDishIn(BaseModel):
    dish_id: int
    quantity: int = 1


class RecurringOrderCreate(BaseModel):
    label: str
    service_type_id: int
    event_type: str
    guest_count: int
    delivery_address_id: int
    special_instructions: Optional[str] = None
    dishes: List[RecurringDishIn]
    frequency: str  # Weekly | Biweekly | Monthly
    next_date: date


class RecurringOrderOut(BaseModel):
    id: int
    label: str
    service_type_id: int
    event_type: str
    guest_count: int
    delivery_address_id: int
    special_instructions: Optional[str]
    dishes_json: str
    frequency: str
    next_date: date
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
