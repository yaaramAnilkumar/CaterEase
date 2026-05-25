from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import all models here so Alembic can detect them
from app.models import user, location, menu, order, payment, password_reset, otp, review, promo_code, enquiry, recurring_order, push_subscription, audit_log, blocked_date, chat  # noqa: F401, E402
