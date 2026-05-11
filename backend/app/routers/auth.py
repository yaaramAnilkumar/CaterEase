from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import random
from app.db.session import get_db
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.models.password_reset import PasswordResetToken
from app.models.otp import OTPToken
from app.schemas.user import UserCreate, UserLogin, UserOut, Token, ForgotPasswordRequest, ResetPasswordRequest, SendOTPRequest, VerifyOTPRequest
from app.routers.deps import get_current_user
from app.services.email_service import send_password_reset_email
from app.services.sms_service import send_otp_sms
from app.core.rate_limit import rate_limiter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.phone == payload.phone).first():
        raise HTTPException(status_code=400, detail="Phone already registered")
    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    if not rate_limiter.is_allowed(f"login:{payload.email}", max_requests=10, window_seconds=900):
        raise HTTPException(status_code=429, detail="Too many login attempts. Please try again in 15 minutes.")
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")
    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password", status_code=200)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    if not rate_limiter.is_allowed(f"forgot:{payload.email}", max_requests=3, window_seconds=3600):
        raise HTTPException(status_code=429, detail="Too many reset requests. Please try again in an hour.")
    user = db.query(User).filter(User.email == payload.email).first()
    # Always return 200 to avoid leaking whether the email exists
    if not user:
        return {"detail": "If that email is registered, a reset link has been sent."}

    # Invalidate any existing unused tokens for this email
    db.query(PasswordResetToken).filter(
        PasswordResetToken.email == payload.email,
        PasswordResetToken.used == False,  # noqa: E712
    ).update({"used": True})

    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)
    db.add(PasswordResetToken(email=payload.email, token=token, expires_at=expires_at))
    db.commit()

    send_password_reset_email(payload.email, token)
    return {"detail": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password", status_code=200)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == payload.token,
        PasswordResetToken.used == False,  # noqa: E712
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    if datetime.utcnow() > record.expires_at:
        record.used = True
        db.commit()
        raise HTTPException(status_code=400, detail="Reset link has expired. Please request a new one.")

    user = db.query(User).filter(User.email == record.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(payload.new_password)
    record.used = True
    db.commit()
    return {"detail": "Password reset successfully. You can now log in."}


@router.post("/send-otp", status_code=200)
def send_otp(payload: SendOTPRequest, db: Session = Depends(get_db)):
    phone = payload.phone.strip()

    # Rate-limit: 1 OTP per 60 seconds per phone
    cutoff = datetime.utcnow() - timedelta(seconds=60)
    recent = db.query(OTPToken).filter(
        OTPToken.phone == phone,
        OTPToken.created_at > cutoff,
    ).first()
    if recent:
        raise HTTPException(status_code=429, detail="Please wait a moment before requesting another OTP.")

    # Invalidate previous unused OTPs for this phone
    db.query(OTPToken).filter(
        OTPToken.phone == phone,
        OTPToken.used == False,  # noqa: E712
    ).update({"used": True})

    otp = "".join([str(random.randint(0, 9)) for _ in range(settings.OTP_LENGTH)])
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    db.add(OTPToken(phone=phone, otp=otp, expires_at=expires_at))
    db.commit()

    try:
        send_otp_sms(phone, otp)
    except Exception as exc:
        # SMS delivery failed — log OTP to console so admin can relay it manually
        print(f"[OTP] SMS failed for {phone}: {exc}. OTP={otp} (valid {settings.OTP_EXPIRE_MINUTES} min)")

    is_new_user = db.query(User).filter(User.phone == phone).first() is None
    return {"detail": "OTP sent", "is_new_user": is_new_user}


@router.post("/verify-otp", response_model=Token)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    phone = payload.phone.strip()

    record = db.query(OTPToken).filter(
        OTPToken.phone == phone,
        OTPToken.used == False,  # noqa: E712
    ).order_by(OTPToken.id.desc()).first()

    if not record:
        raise HTTPException(status_code=400, detail="No active OTP found. Please request a new one.")
    if datetime.utcnow() > record.expires_at:
        record.used = True
        db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    record.attempts += 1
    if record.attempts > settings.OTP_MAX_ATTEMPTS:
        record.used = True
        db.commit()
        raise HTTPException(status_code=400, detail="Too many incorrect attempts. Please request a new OTP.")

    if record.otp != payload.otp:
        db.commit()
        remaining = settings.OTP_MAX_ATTEMPTS - record.attempts
        raise HTTPException(status_code=400, detail=f"Incorrect OTP. {remaining} attempt(s) remaining.")

    record.used = True
    db.commit()

    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        if not payload.name or not payload.name.strip():
            raise HTTPException(status_code=400, detail="Name is required to create your account.")
        referrer = None
        if payload.referral_code:
            referrer = db.query(User).filter(User.referral_code == payload.referral_code.strip().upper()).first()
        user = User(
            name=payload.name.strip(),
            email=f"otp_{phone}@caterease.local",
            phone=phone,
            hashed_password=hash_password(secrets.token_hex(32)),
            referred_by_id=referrer.id if referrer else None,
            loyalty_points=50 if referrer else 0,  # referee bonus
        )
        db.add(user)
        db.flush()
        if referrer:
            referrer.loyalty_points += 100  # referrer bonus
        db.commit()
        db.refresh(user)

    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user))
