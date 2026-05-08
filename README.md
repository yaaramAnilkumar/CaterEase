# CaterEase — Full-Stack Catering Platform

A production-ready catering management platform for event-based food ordering, built for businesses operating across multiple cities. Customers can browse menus, place orders, track deliveries live, and manage their accounts. Admins get a full back-office to manage orders, menus, customers, promos, and analytics.

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI (Python) |
| ORM | SQLAlchemy 2.0 |
| Database | SQLite (dev) → PostgreSQL (prod) |
| Auth | JWT (python-jose) + bcrypt passwords |
| Payments | Razorpay (mock mode when keys absent) |
| SMS / OTP | Twilio |
| Email | SMTP (any provider) |
| Image Uploads | Cloudinary |
| Push Notifications | Web Push / VAPID (pywebpush) |
| Migrations | Auto-migration via lifespan event (ALTER TABLE) |
| Server | Uvicorn |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State Management | Zustand (persist) |
| HTTP Client | Axios |
| Icons | Lucide React |
| PWA | Service Worker + Web Manifest |

---

## Project Structure

```
CaterEase/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, security, rate limiter
│   │   ├── db/             # SQLAlchemy session + base
│   │   ├── models/         # All database models
│   │   ├── routers/        # All API route handlers
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   └── services/       # Email, SMS, push, Razorpay, Cloudinary
│   ├── .env                # Environment variables
│   ├── main.py             # App entry point
│   └── requirements.txt
└── frontend/
    ├── app/                # Next.js App Router pages
    ├── components/         # Reusable UI components
    ├── lib/                # API client, types, utils
    ├── store/              # Zustand stores (auth, cart)
    ├── public/             # Static assets, SW, manifest
    └── .env.local          # Frontend environment variables
```

---

## Features

### Customer-Facing

#### Ordering
- **Menu browsing** — dishes organised by category with images, dietary tags, star ratings
- **Dietary filters** — All / Veg / Non-Veg / Jain / Vegan / Gluten-Free
- **Menu search** — real-time client-side search by dish name
- **Cart** — add/remove dishes, set guest count, persisted across sessions
- **Checkout** — service type, package, guest count, event type, date/time, delivery address
- **Blocked date enforcement** — admin-blocked dates rejected at checkout with a clear message
- **Reorder** — one click to reload a past order's dishes into cart

#### Payments
- **Razorpay integration** — live payment popup in production
- **Mock mode** — auto-confirms orders when Razorpay keys are not set (dev/demo)
- **Payment verification** — server-side HMAC signature check
- **Razorpay webhook** — `/payments/webhook` for server-side payment capture events

#### Discounts & Loyalty
- **Guest count discount** — configurable % off for orders above a guest threshold (default 50 guests → 5% off)
- **Corporate discount** — admin assigns a custom % discount to corporate accounts
- **Promo codes** — percent or flat discount, min order amount, usage limits, expiry dates
- **Loyalty points** — earn points on every paid order, redeem at checkout for rupee discount
- **Referral system** — unique referral code per user; referrer gets 100 pts, new user gets 50 pts on signup

#### Order Management
- **Order history** — list of all past and active orders
- **Live order tracking** — status timeline (Pending → Confirmed → Preparing → Out for Delivery → Delivered) with 15-second auto-refresh and a "Live" pulse indicator
- **Order detail page** — event info, payment breakdown, dishes, points earned
- **Printable invoice** — `/orders/[id]/invoice` with full branded invoice, print/PDF button
- **CSV export** — download all your orders as a spreadsheet

#### Account
- **OTP login** — phone-based login via SMS OTP (Twilio), creates account on first login
- **Email/password login** — traditional registration and login
- **Profile page** — update name/phone, change password, manage saved addresses, referral code
- **Loyalty points balance** — visible on orders page and profile
- **Saved addresses** — add at checkout, manage from profile
- **Recurring orders** — save an order as a weekly/biweekly/monthly schedule

#### Notifications
- **Push notifications** — browser push for order status changes (VAPID/Web Push)
- **Permission banner** — non-intrusive prompt on orders page to enable notifications
- **Order confirmation email** — branded HTML email sent on payment success

#### Other
- **Catering enquiry form** — public "Get a Quote" form for non-digital leads
- **Reviews & ratings** — submit a star rating + comment after delivery; shown on menu dishes
- **PWA** — installable on Android/iOS, offline-capable via service worker
- **SEO** — page metadata, Open Graph tags, JSON-LD LocalBusiness structured data

---

### Admin Back-Office

#### Dashboard (`/admin/dashboard`)
- Stats: total orders, today's orders, pending count, total revenue, today's revenue
- Orders by status — bar breakdown
- Popular dishes — top 5 by quantity ordered
- Revenue chart — 30-day bar chart (hover for daily totals)
- Revenue by event type — horizontal bars showing which event types earn most

#### Order Management (`/admin/orders`)
- Full order table: customer name + phone, event, guests, amount, event date, status
- **Filter** by status, event date range
- **Search** by customer name or order ID (`#42` or `42`)
- **Status update** — dropdown per row, triggers push notification to customer
- **Audit log** — every status change recorded with admin name, old/new status, timestamp
- **CSV export** — download filtered orders as spreadsheet

#### Menu Management (`/admin/menus`)
- Create/edit/delete dishes and categories
- Set dietary flags (Veg, Jain, Vegan, Gluten-Free), price, availability, popular flag
- Upload dish images to Cloudinary or paste an image URL
- Thumbnail preview in dish table

#### Promo Codes (`/admin/promos`)
- Create percent or flat discount codes
- Set minimum order amount, max uses, expiry date
- Toggle active/inactive, delete

#### Enquiries (`/admin/enquiries`)
- Inbox of all "Get a Quote" submissions
- Filter by status: New / Contacted / Closed
- Update enquiry status

#### Users (`/admin/users`)
- Customer table with loyalty points and account creation date
- Toggle corporate status and set corporate discount %

#### Reviews (`/admin/reviews`)
- All submitted reviews with customer name, dish, rating, comment
- Filter: All / Pending / Approved
- Approve/unapprove reviews (only approved reviews count toward dish star ratings)
- Delete reviews

#### Blocked Dates (`/admin/blocked-dates`)
- Block specific dates with an optional reason (holidays, fully booked)
- Customers cannot select blocked dates at checkout
- Add/remove dates

#### Audit Log (`/admin/audit`)
- Immutable record of admin actions (order status changes)
- Shows admin name, action, target order, timestamp

---

## API Reference (Key Endpoints)

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Email/password registration |
| POST | `/auth/login` | Email/password login |
| POST | `/auth/send-otp` | Send OTP to phone (rate limited: 1/60s) |
| POST | `/auth/verify-otp` | Verify OTP, create account if new |
| POST | `/auth/forgot-password` | Send reset link (rate limited: 3/hr) |
| POST | `/auth/reset-password` | Reset password via token |

### Menu
| Method | Endpoint | Description |
|---|---|---|
| GET | `/menu/categories` | List active categories |
| GET | `/menu/dishes` | List dishes (filter by category, dietary, popular) |
| GET | `/menu/service-types` | Service types with packages |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders/` | Place an order |
| GET | `/orders/` | Customer's order history |
| GET | `/orders/{id}` | Order detail |
| PUT | `/orders/{id}/status` | Update status (admin) |
| POST | `/orders/{id}/review` | Submit review (after delivery) |
| GET | `/orders/admin/all` | All orders with filters + search (admin) |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/payments/create` | Create Razorpay order |
| POST | `/payments/verify` | Verify payment signature |
| POST | `/payments/webhook` | Razorpay webhook (server-side capture) |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/users/me` | Current user profile |
| PATCH | `/users/me` | Update name/phone |
| POST | `/users/me/change-password` | Change password |
| GET | `/users/me/addresses` | List saved addresses |
| POST | `/users/me/addresses` | Add address |
| DELETE | `/users/me/addresses/{id}` | Delete address |
| GET | `/users/me/referral` | Referral code + stats |

### Other
| Method | Endpoint | Description |
|---|---|---|
| POST | `/promo/validate` | Validate promo code |
| POST | `/enquiries/` | Submit catering enquiry |
| POST | `/upload/image` | Upload dish image to Cloudinary (admin) |
| GET | `/blocked-dates/` | List blocked dates (public) |
| GET | `/push/vapid-public-key` | VAPID key for push subscription |
| POST | `/push/subscribe` | Register push subscription |
| GET | `/admin/dashboard` | Dashboard stats |
| GET | `/admin/revenue-chart` | 30-day revenue data |
| GET | `/admin/revenue-by-event-type` | Revenue breakdown by event type |
| GET | `/audit/logs` | Admin audit log |

---

## Environment Variables

### Backend (`backend/.env`)
```env
# App
APP_NAME=CaterEase
APP_VERSION=1.0.0
BACKEND_PORT=8001
CORS_ORIGINS=http://localhost:3000

# Database & Auth
DATABASE_URL=sqlite:///./catering.db   # swap to postgresql://... in prod
SECRET_KEY=your-secret-key-here        # generate: python -c "import secrets; print(secrets.token_hex(32))"
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Payments
RAZORPAY_KEY_ID=                       # leave empty for mock/dev mode
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=               # set in Razorpay dashboard → Webhooks

# Image uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# SMS / OTP (leave empty to log OTPs to console)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=+1xxxxxxxxxx

# Email / SMTP (leave empty to log reset links to console)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
FRONTEND_URL=http://localhost:3000
RESET_TOKEN_EXPIRE_MINUTES=60

# Web Push / VAPID (leave empty to log pushes to console)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY_B64=
VAPID_EMAIL=admin@yourdomain.com

# Loyalty
POINTS_PER_HUNDRED=1
POINTS_RUPEE_VALUE=0.10

# Business config
CURRENCY=INR
DEFAULT_CITY=Bangalore
EVENT_TYPES=Birthday,Wedding,Corporate,Sangeet,Farmhouse Party,Tea Party,Family Reunion,Other
CITIES=Bangalore,Tirupati
DISCOUNT_THRESHOLD_GUESTS=50
DISCOUNT_PERCENT=5.0

# Seed credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=Admin@123
ADMIN_PHONE=9999999999
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=CaterEase
NEXT_PUBLIC_RAZORPAY_KEY_ID=           # must match backend RAZORPAY_KEY_ID
NEXT_PUBLIC_BRAND_COLOR=#f97316
```

---

## Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # fill in your values
python -m uvicorn app.main:app --reload --port 8001
```

The database is created automatically on first run. All schema migrations run on startup — no manual steps needed.

To seed initial data (admin account + sample menu):
```bash
python seed.py
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in your values
npm run dev                          # development (hot reload)
# or
npm run build && npm start           # production
```

---

## Deployment Notes

### Database
Replace `DATABASE_URL` in `.env` with a PostgreSQL connection string for production:
```
DATABASE_URL=postgresql://user:password@host:5432/caterease
```
Install the driver: `pip install psycopg2-binary`

### HTTPS
Push notifications and PWA install require HTTPS. Use a reverse proxy (Nginx + Let's Encrypt) or a platform like Railway, Render, or Vercel.

### PWA Icons
The current icons are SVG. For iOS home screen install support, generate PNG versions:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)

Update `manifest.json` to reference the PNG files.

### Razorpay Webhook
In the Razorpay dashboard → Webhooks, register:
```
https://yourdomain.com/payments/webhook
```
Set the webhook secret and add it to `RAZORPAY_WEBHOOK_SECRET` in `.env`.

### VAPID Keys (Push Notifications)
Generate a new key pair:
```python
from py_vapid import Vapid
import base64, json

v = Vapid()
v.generate_keys()
print("Public:", v.public_key)
print("Private (b64):", base64.b64encode(v.private_key.private_bytes(
    encoding=__import__('cryptography').hazmat.primitives.serialization.Encoding.PEM,
    format=__import__('cryptography').hazmat.primitives.serialization.PrivateFormat.PKCS8,
    encryption_algorithm=__import__('cryptography').hazmat.primitives.serialization.NoEncryption()
)).decode())
```

---

## Rate Limiting

| Endpoint | Limit |
|---|---|
| `POST /auth/send-otp` | 1 request per 60 seconds per phone |
| `POST /auth/login` | 10 attempts per 15 minutes per email |
| `POST /auth/forgot-password` | 3 requests per hour per email |
| OTP attempts | Max 5 attempts per OTP before invalidation |

Rate limiting is in-memory (single-process). For multi-process deployments, replace with Redis-backed limiting.

---

## Key Design Decisions

- **Auto-migrations** — new columns are added via `ALTER TABLE` in the app lifespan event, so deploys are zero-downtime with no migration tool needed for SQLite
- **Dev mode fallbacks** — SMS, email, and push notifications all fall back to console logging when credentials are absent, so the app is fully functional without third-party services configured
- **Mock payments** — Razorpay is skipped entirely when keys are empty; orders auto-confirm so the full order flow can be tested without a payment account
- **Approved reviews** — reviews are held pending admin approval before they affect dish star ratings
- **Points never go negative** — loyalty point redemption is capped at the remaining payable amount after all other discounts
