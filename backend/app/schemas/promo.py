from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class ValidatePromoRequest(BaseModel):
    code: str
    order_amount: float


class ValidatePromoResponse(BaseModel):
    valid: bool
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    discount_amount: Optional[float] = None
    message: str


class PromoCodeCreate(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str  # "percent" or "flat"
    discount_value: float
    min_order_amount: float = 0
    max_uses: Optional[int] = None
    expires_at: Optional[datetime] = None

    @field_validator("code")
    @classmethod
    def uppercase_code(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("discount_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in ("percent", "flat"):
            raise ValueError("discount_type must be 'percent' or 'flat'")
        return v

    @field_validator("discount_value")
    @classmethod
    def validate_value(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("discount_value must be positive")
        return v


class PromoCodeOut(BaseModel):
    id: int
    code: str
    description: Optional[str]
    discount_type: str
    discount_value: float
    min_order_amount: float
    max_uses: Optional[int]
    used_count: int
    is_active: bool
    expires_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}
