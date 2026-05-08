from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, locations, menu, orders, payments, admin, users, app_config
from app.routers import promo, enquiry, upload, recurring, push, reviews, audit, blocked_dates


def _run_migrations():
    """Add columns that may be missing from existing SQLite databases."""
    from app.db.session import engine
    from app.db.base import Base
    Base.metadata.create_all(bind=engine)  # create new tables (promo_codes, etc.)

    migrations = [
        "ALTER TABLE orders ADD COLUMN promo_code_id INTEGER REFERENCES promo_codes(id)",
        "ALTER TABLE orders ADD COLUMN promo_discount REAL DEFAULT 0",
        "ALTER TABLE orders ADD COLUMN points_redeemed INTEGER DEFAULT 0",
        "ALTER TABLE orders ADD COLUMN points_discount REAL DEFAULT 0",
        "ALTER TABLE orders ADD COLUMN points_earned INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN is_corporate INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN corporate_discount INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN loyalty_points INTEGER DEFAULT 0",
        "ALTER TABLE reviews ADD COLUMN is_approved INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN referral_code VARCHAR(16)",
        "ALTER TABLE users ADD COLUMN referred_by_id INTEGER REFERENCES users(id)",
        # audit_logs and blocked_dates are created fresh via create_all
    ]
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(__import__("sqlalchemy").text(sql))
                conn.commit()
            except Exception:
                pass  # column already exists


@asynccontextmanager
async def lifespan(app: FastAPI):
    _run_migrations()
    yield


app = FastAPI(
    title=f"{settings.APP_NAME} API",
    description=f"Backend API for {settings.APP_NAME}",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(locations.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(admin.router)
app.include_router(users.router)
app.include_router(app_config.router)
app.include_router(promo.router)
app.include_router(enquiry.router)
app.include_router(upload.router)
app.include_router(recurring.router)
app.include_router(push.router)
app.include_router(reviews.router)
app.include_router(audit.router)
app.include_router(blocked_dates.router)


@app.get("/", tags=["health"])
def health():
    return {"status": "ok", "service": "Catering App API"}
