"""
FastAPI application entry point.
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import create_all_tables
from app.routers import auth, detections, search, analytics, alerts, cameras, stream

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("Starting ANPR Platform API...")
    
    # Create upload directories
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "snapshots"), exist_ok=True)
    
    # Create DB tables
    await create_all_tables()
    
    # Seed default admin user if not exists
    await seed_admin()
    
    logger.info("ANPR Platform API ready.")
    yield
    logger.info("ANPR Platform API shutting down.")


async def seed_admin():
    """Create a default admin user on first run."""
    from app.database import AsyncSessionLocal
    from app.models.user import User, UserRole
    from app.services.auth import hash_password
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.username == "admin"))
        if not result.scalar_one_or_none():
            admin = User(
                username="admin",
                email="admin@anpr.local",
                hashed_password=hash_password("admin123"),
                role=UserRole.admin,
                is_active=True,
            )
            db.add(admin)
            await db.commit()
            logger.info("Default admin user created: admin / admin123")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered Automatic Number Plate Recognition platform for Indian vehicles",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
PREFIX = "/api/v1"
app.include_router(auth.router, prefix=PREFIX)
app.include_router(detections.router, prefix=PREFIX)
app.include_router(search.router, prefix=PREFIX)
app.include_router(analytics.router, prefix=PREFIX)
app.include_router(alerts.router, prefix=PREFIX)
app.include_router(cameras.router, prefix=PREFIX)
app.include_router(stream.router, prefix=PREFIX)

# Static files for snapshots
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
