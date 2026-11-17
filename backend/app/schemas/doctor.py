from datetime import date, datetime, time
from pydantic import BaseModel, ConfigDict
from app.models.shift import DayOfWeek, VacationStatus
from app.models.appointment import AppointmentStatus, TriageUrgency


class DoctorProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    phone_number: str | None = None
    license_number: str
    bio: str | None = None
    specialty_name: str | None = None
    average_rating: float
    total_ratings: int

    model_config = ConfigDict(from_attributes=True)


class ShiftItem(BaseModel):
    id: int
    day_of_week: DayOfWeek
    start_time: time
    end_time: time

    model_config = ConfigDict(from_attributes=True)


class VacationCreate(BaseModel):
    start_date: date
    end_date: date
    reason: str | None = None


class VacationResponse(BaseModel):
    id: int
    doctor_id: int
    start_date: date
    end_date: date
    status: VacationStatus
    reason: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VacationStatusUpdate(BaseModel):
    status: VacationStatus


class DoctorAppointmentResponse(BaseModel):
    id: int
    patient_id: int
    patient_name: str
    patient_email: str
    patient_phone: str | None = None
    appointment_date: datetime
    status: AppointmentStatus
    symptoms: str | None = None
    triage_urgency: TriageUrgency | None = None
    created_at: datetime
    has_prescription: bool

    model_config = ConfigDict(from_attributes=True)
