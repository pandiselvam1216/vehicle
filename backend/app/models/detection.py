import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Detection(Base):
    __tablename__ = "detections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plate_number = Column(String(20), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    raw_text = Column(String(50))
    is_valid_format = Column(String(5), default="false")
    camera_id = Column(String(100), nullable=True, index=True)
    location = Column(String(200), nullable=True)
    snapshot_path = Column(String(500), nullable=True)
    vehicle_type = Column(String(50), nullable=True)
    vehicle_color = Column(String(50), nullable=True)
    source = Column(String(20), default="upload")  # upload | stream | video
    detected_at = Column(DateTime, default=datetime.utcnow, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "plate_number": self.plate_number,
            "confidence": self.confidence,
            "raw_text": self.raw_text,
            "is_valid_format": self.is_valid_format,
            "camera_id": self.camera_id,
            "location": self.location,
            "snapshot_path": self.snapshot_path,
            "vehicle_type": self.vehicle_type,
            "vehicle_color": self.vehicle_color,
            "source": self.source,
            "detected_at": self.detected_at.isoformat() if self.detected_at else None,
        }
