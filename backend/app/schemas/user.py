from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    role: UserRole
    is_active: bool
    is_corporate: bool
    corporate_discount: int
    loyalty_points: int
    referral_code: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UpdateProfile(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class CorporateUpdate(BaseModel):
    is_corporate: bool
    corporate_discount: int = 0  # percent, 0-50


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class SendOTPRequest(BaseModel):
    phone: str


class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None
    referral_code: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class AddressCreate(BaseModel):
    label: str = "Home"
    line1: str
    area: str
    city: str
    pincode: str
    is_default: bool = False


class AddressOut(AddressCreate):
    id: int
    user_id: int

    model_config = {"from_attributes": True}
