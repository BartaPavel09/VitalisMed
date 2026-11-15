from datetime import time
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.shift import DayOfWeek


class SpecialtyCreate(BaseModel):
    name: str
    description: str | None = None


class SpecialtyResponse(BaseModel):
    id: int
    name: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)


class DoctorCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: str | None = None
    specialty_id: int
    license_number: str
    bio: str | None = None


class DoctorResponse(BaseModel):
    id: int
    user_id: int
    email: str
    full_name: str
    phone_number: str | None = None
    license_number: str
    bio: str | None = None
    specialty_id: int | None = None
    specialty_name: str | None = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class ShiftCreate(BaseModel):
    doctor_id: int
    day_of_week: DayOfWeek
    start_time: time
    end_time: time


class ShiftResponse(BaseModel):
    id: int
    doctor_id: int
    day_of_week: DayOfWeek
    start_time: time
    end_time: time

    model_config = ConfigDict(from_attributes=True)
