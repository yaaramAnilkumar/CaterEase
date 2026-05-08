import smtplib
from datetime import date
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


def _is_email_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)


def _send(to_email: str, subject: str, body_html: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = to_email
    msg.attach(MIMEText(body_html, "html"))
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(msg["From"], [to_email], msg.as_string())


def send_password_reset_email(to_email: str, reset_token: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

    if not _is_email_configured():
        print(f"\n[DEV] Password reset requested for: {to_email}")
        print(f"[DEV] Reset link (expires in {settings.RESET_TOKEN_EXPIRE_MINUTES} min):")
        print(f"[DEV] {reset_url}\n")
        return

    subject = f"Reset your {settings.APP_NAME} password"
    body_html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2>Reset your password</h2>
      <p>Click the link below to reset your <strong>{settings.APP_NAME}</strong> password.
         This link expires in {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes.</p>
      <a href="{reset_url}"
         style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;
                border-radius:8px;text-decoration:none;font-weight:600">
        Reset Password
      </a>
      <p style="margin-top:24px;font-size:12px;color:#9ca3af">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    """

    _send(to_email, subject, body_html)


def send_order_confirmation_email(
    to_email: str,
    customer_name: str,
    order_id: int,
    event_type: str,
    event_date: date,
    guest_count: int,
    total_amount: float,
) -> None:
    orders_url = f"{settings.FRONTEND_URL}/orders/{order_id}"
    formatted_date = event_date.strftime("%d %B %Y") if hasattr(event_date, "strftime") else str(event_date)
    formatted_amount = f"₹{total_amount:,.2f}"

    if not _is_email_configured():
        print(f"\n[DEV] Order #{order_id} confirmation for {to_email}")
        print(f"[DEV] {event_type} · {formatted_date} · {guest_count} guests · {formatted_amount}\n")
        return

    subject = f"Order Confirmed — {settings.APP_NAME} #{order_id}"
    body_html = f"""
    <div style="font-family:sans-serif;max-width:520px;margin:auto;color:#111827">
      <div style="background:#f97316;padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:22px">{settings.APP_NAME}</h1>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #f3f4f6;border-top:none;border-radius:0 0 12px 12px">
        <h2 style="margin:0 0 8px">Your order is confirmed! 🎉</h2>
        <p style="color:#6b7280;margin:0 0 24px">Hi {customer_name}, we've received your catering order and will be in touch soon.</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
          <tr style="border-bottom:1px solid #f3f4f6">
            <td style="padding:10px 0;color:#6b7280">Order</td>
            <td style="padding:10px 0;text-align:right;font-weight:600">#{order_id}</td>
          </tr>
          <tr style="border-bottom:1px solid #f3f4f6">
            <td style="padding:10px 0;color:#6b7280">Event</td>
            <td style="padding:10px 0;text-align:right">{event_type}</td>
          </tr>
          <tr style="border-bottom:1px solid #f3f4f6">
            <td style="padding:10px 0;color:#6b7280">Date</td>
            <td style="padding:10px 0;text-align:right">{formatted_date}</td>
          </tr>
          <tr style="border-bottom:1px solid #f3f4f6">
            <td style="padding:10px 0;color:#6b7280">Guests</td>
            <td style="padding:10px 0;text-align:right">{guest_count}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#6b7280;font-weight:600">Total Paid</td>
            <td style="padding:10px 0;text-align:right;font-weight:700;color:#f97316;font-size:16px">{formatted_amount}</td>
          </tr>
        </table>

        <a href="{orders_url}"
           style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;
                  border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Track Your Order
        </a>

        <p style="margin-top:24px;font-size:12px;color:#9ca3af">
          Questions? Reply to this email or contact us. We're here to make your event perfect.
        </p>
      </div>
    </div>
    """
    _send(to_email, subject, body_html)
