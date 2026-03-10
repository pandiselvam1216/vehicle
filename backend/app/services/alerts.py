"""
Blacklist alert service — checks detections against blacklisted plates.
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.blacklist import Blacklist
from app.models.alert import AlertLog

logger = logging.getLogger(__name__)


async def check_blacklist(plate_number: str, db: AsyncSession) -> bool:
    """Return True if plate is blacklisted and active."""
    result = await db.execute(
        select(Blacklist).where(
            Blacklist.plate_number == plate_number.upper(),
            Blacklist.is_active == True,
        )
    )
    return result.scalar_one_or_none() is not None


async def create_alert(
    plate_number: str,
    camera_id: str,
    message: str,
    db: AsyncSession,
) -> AlertLog:
    """Create an alert log entry."""
    alert = AlertLog(
        plate_number=plate_number.upper(),
        alert_type="blacklist",
        camera_id=camera_id,
        message=message,
        notification_sent="false",
    )
    db.add(alert)
    await db.flush()
    logger.warning(f"ALERT: Blacklisted plate {plate_number} detected at camera {camera_id}")
    return alert
