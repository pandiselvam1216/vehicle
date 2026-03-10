import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Blacklist(Base):
    __tablename__ = "blacklist"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plate_number = Column(String(20), unique=True, nullable=False, index=True)
    reason = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    added_by = Column(String(100), nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "plate_number": self.plate_number,
            "reason": self.reason,
            "is_active": self.is_active,
            "added_by": self.added_by,
            "added_at": self.added_at.isoformat() if self.added_at else None,
        }
