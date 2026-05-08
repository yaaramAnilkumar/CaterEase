from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    # ── App identity ─────────────────────────────────────────────────────────
    APP_NAME: str = "CaterEase"
    APP_VERSION: str = "1.0.0"

    # ── Server ───────────────────────────────────────────────────────────────
    BACKEND_PORT: int = 8001
    CORS_ORIGINS: str = "http://localhost:3000"

    # ── Database & Auth ──────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./catering.db"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    # ── Payments (optional in dev — mock mode used when empty) ───────────────
    RAZORPAY_KEY_ID: Optional[str] = ""
    RAZORPAY_KEY_SECRET: Optional[str] = ""
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = ""

    # ── Image uploads (optional in dev) ─────────────────────────────────────
    CLOUDINARY_CLOUD_NAME: Optional[str] = ""
    CLOUDINARY_API_KEY: Optional[str] = ""
    CLOUDINARY_API_SECRET: Optional[str] = ""

    # ── Business config ──────────────────────────────────────────────────────
    CURRENCY: str = "INR"
    DEFAULT_CITY: str = "Bangalore"
    EVENT_TYPES: str = "Birthday,Wedding,Corporate,Sangeet,Farmhouse Party,Tea Party,Family Reunion,Other"
    CITIES: str = "Bangalore,Tirupati"
    DISCOUNT_THRESHOLD_GUESTS: int = 50
    DISCOUNT_PERCENT: float = 5.0

    # ── Web Push / VAPID (leave empty → dev mode: push printed to console) ──────
    VAPID_PUBLIC_KEY: str = ""   # base64url-encoded uncompressed EC public key
    VAPID_PRIVATE_KEY_B64: str = ""  # base64-encoded PEM private key
    VAPID_EMAIL: str = "admin@caterease.in"

    # ── Loyalty points ───────────────────────────────────────────────────────────
    POINTS_PER_HUNDRED: int = 1       # points earned per ₹100 spent
    POINTS_RUPEE_VALUE: float = 0.10  # ₹ value of 1 point (100 pts = ₹10)

    # ── OTP / SMS (leave empty → dev mode: OTP printed to console) ─────────────
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""
    OTP_LENGTH: int = 6
    OTP_EXPIRE_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 5

    # ── Email / SMTP (leave empty → dev mode: reset link printed to console) ──
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    RESET_TOKEN_EXPIRE_MINUTES: int = 60

    # ── Seed credentials (used only by seed.py) ──────────────────────────────
    ADMIN_EMAIL: str = "admin@caterease.in"
    ADMIN_PASSWORD: str = "Admin@123"
    ADMIN_PHONE: str = "9999999999"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def event_types_list(self) -> List[str]:
        return [e.strip() for e in self.EVENT_TYPES.split(",")]

    @property
    def cities_list(self) -> List[str]:
        return [c.strip() for c in self.CITIES.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
