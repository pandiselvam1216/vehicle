import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class AlertLog(Base):
    __tablename__ = "alert_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plate_number = Column(String(20), nullable=False, index=True)
    alert_type = Column(String(50), default="blacklist")
    camera_id = Column(String(100), nullable=True)
    message = Column(Text, nullable=True)
    notification_sent = Column(String(10), default="false")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "plate_number": self.plate_number,
            "alert_type": self.alert_type,
            "camera_id": self.camera_id,
            "message": self.message,
            "notification_sent": self.notification_sent,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
