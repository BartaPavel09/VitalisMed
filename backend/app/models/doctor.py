from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Specialty(Base):
    __tablename__ = "specialties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)

    doctors = relationship("Doctor", back_populates="specialty")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    specialty_id = Column(Integer, ForeignKey("specialties.id", ondelete="SET NULL"), nullable=True)
    license_number = Column(String(100), unique=True, nullable=False)
    bio = Column(Text, nullable=True)

    user = relationship("User", back_populates="doctor_profile")
    specialty = relationship("Specialty", back_populates="doctors")
    shifts = relationship("DoctorShift", back_populates="doctor", cascade="all, delete-orphan")
    vacations = relationship("VacationRequest", back_populates="doctor", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="doctor", foreign_keys="Appointment.doctor_id")
    ratings = relationship("Rating", back_populates="doctor", cascade="all, delete-orphan")
