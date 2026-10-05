from sqlalchemy import Column, Integer, Text, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, nullable=False)
    diagnosis = Column(Text, nullable=True)
    medication_instructions = Column(Text, nullable=True)
    raw_image_path = Column(String(500), nullable=True)
    watermarked_image_path = Column(String(500), nullable=True)
    ocr_engine_used = Column(String(50), nullable=True)
    ocr_raw_text = Column(Text, nullable=True)
    medication_schedule = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    appointment = relationship("Appointment", back_populates="prescription")
