from app.core.config import settings


def send_otp_sms(phone: str, otp: str) -> None:
    if not settings.TWILIO_ACCOUNT_SID:
        print(f"\n[DEV] OTP for {phone}: {otp}  (expires in {settings.OTP_EXPIRE_MINUTES} min)\n")
        return

    from twilio.rest import Client
    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    # Ensure E.164 format: Indian numbers need +91 prefix
    to_number = phone if phone.startswith("+") else f"+91{phone}"
    client.messages.create(
        to=to_number,
        from_=settings.TWILIO_FROM_NUMBER,
        body=f"Your {settings.APP_NAME} OTP is {otp}. Valid for {settings.OTP_EXPIRE_MINUTES} minutes. Do not share it with anyone.",
    )
