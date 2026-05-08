# CaterEase — Setup Guide

## Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ (or Docker)
- Razorpay account (test keys work for dev)
- Cloudinary account (free tier works)

---

## Option A: Docker (Recommended)

```bash
# 1. Clone / navigate to project
cd D:\Python\Caterin_App

# 2. Copy and fill env file
copy backend\.env.example backend\.env
# Fill: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, CLOUDINARY_*

# 3. Start all services
docker-compose up --build

# 4. In another terminal, seed the database
docker-compose exec backend python seed.py

# 5. Open browser
# Frontend: http://localhost:3000
# API docs:  http://localhost:8000/docs
```

---

## Option B: Manual Setup

### Backend

```bash
cd D:\Python\Caterin_App\backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your values

# Create database (PostgreSQL must be running)
# Create DB named: catering_db

# Run migrations
alembic upgrade head

# Seed initial data
python seed.py

# Start backend
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd D:\Python\Caterin_App\frontend

# Install dependencies
npm install

# Configure environment
copy .env.local.example .env.local
# Edit .env.local

# Start dev server
npm run dev
```

---

## URLs

| Service    | URL                          |
|------------|------------------------------|
| Frontend   | http://localhost:3000        |
| API        | http://localhost:8000        |
| API Docs   | http://localhost:8000/docs   |

---

## Default Admin Login

```
Email:    admin@caterease.in
Password: Admin@123
```

---

## Key Pages

| Page              | Path                    |
|-------------------|-------------------------|
| Home              | /                       |
| Menu              | /menu                   |
| Cart              | /cart                   |
| Checkout          | /checkout               |
| My Orders         | /orders                 |
| Order Tracking    | /orders/{id}            |
| Login             | /login                  |
| Register          | /register               |
| Admin Dashboard   | /admin/dashboard        |
| Admin Orders      | /admin/orders           |
| Admin Menu        | /admin/menus            |

---

## Razorpay Test

Use test mode keys from Razorpay dashboard.  
Test card: `4111 1111 1111 1111` | CVV: any | Expiry: any future date
