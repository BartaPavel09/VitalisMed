from datetime import datetime, time, date
from pydantic import BaseModel, ConfigDict
from app.models.shift import DayOfWeek
from app.models.appointment import AppointmentStatus, TriageUrgency


class AvailableDoctorShift(BaseModel):
    id: int
    day_of_week: DayOfWeek
    start_time: time
    end_time: time

    model_config = ConfigDict(from_attributes=True)


class ApprovedVacationSpan(BaseModel):
    start_date: date
    end_date: date

    model_config = ConfigDict(from_attributes=True)


class PublicDoctorInfo(BaseModel):
    id: int
    full_name: str
    email: str
    phone_number: str | None = None
    license_number: str
    bio: str | None = None
    specialty_id: int
    specialty_name: str
    shifts: list[AvailableDoctorShift]
    vacations: list[ApprovedVacationSpan]


class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_date: datetime
    symptoms: str | None = None


class PatientAppointmentResponse(BaseModel):
    id: int
    doctor_id: int
    doctor_name: str
    specialty_name: str
    appointment_date: datetime
    status: AppointmentStatus
    symptoms: str | None = None
    triage_urgency: TriageUrgency | None = None
    created_at: datetime
    can_cancel: bool
    has_prescription: bool
    diagnosis: str | None = None
    medication_instructions: str | None = None

    model_config = ConfigDict(from_attributes=True)
