from datetime import time, timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.models.doctor import Doctor, Specialty
from app.models.shift import DoctorShift, VacationRequest, VacationStatus, DayOfWeek
from app.schemas.admin import (
    DoctorCreate,
    DoctorUpdate,
    DoctorResponse,
    SpecialtyCreate,
    SpecialtyResponse,
    ShiftCreate,
    ShiftResponse
)
from app.schemas.doctor import VacationResponse, VacationStatusUpdate

router = APIRouter(dependencies=[Depends(require_roles([UserRole.ADMIN]))])

DAY_ORDER = {
    DayOfWeek.MONDAY: 0,
    DayOfWeek.TUESDAY: 1,
    DayOfWeek.WEDNESDAY: 2,
    DayOfWeek.THURSDAY: 3,
    DayOfWeek.FRIDAY: 4,
    DayOfWeek.SATURDAY: 5,
    DayOfWeek.SUNDAY: 6
}


@router.get("/specialties", response_model=list[SpecialtyResponse])
def get_specialties(db: Session = Depends(get_db)) -> list[Specialty]:
    """
    Retrieve all medical specialties available in the clinic.

    @param db: Database session dependency.
    @return: List of Specialty ORM instances.
    """
    return db.query(Specialty).order_by(Specialty.name).all()


@router.post("/specialties", response_model=SpecialtyResponse, status_code=status.HTTP_201_CREATED)
def create_specialty(specialty_in: SpecialtyCreate, db: Session = Depends(get_db)) -> Specialty:
    """
    Register a new medical specialty.

    @param specialty_in: Specialty payload containing name and description.
    @param db: Database session dependency.
    @return: Newly created Specialty record.
    """
    existing = db.query(Specialty).filter(Specialty.name == specialty_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specialty with this name already exists"
        )

    specialty = Specialty(
        name=specialty_in.name,
        description=specialty_in.description
    )
    db.add(specialty)
    db.commit()
    db.refresh(specialty)
    return specialty


@router.get("/doctors", response_model=list[DoctorResponse])
def get_doctors(db: Session = Depends(get_db)) -> list[dict]:
    """
    Retrieve all doctors with their user profiles and specialty assignments.

    @param db: Database session dependency.
    @return: List of doctor dictionaries mapped to DoctorResponse schema.
    """
    doctors = db.query(Doctor).join(User).all()
    results = []
    for doc in doctors:
        results.append({
            "id": doc.id,
            "user_id": doc.user_id,
            "email": doc.user.email,
            "full_name": doc.user.full_name,
            "phone_number": doc.user.phone_number,
            "license_number": doc.license_number,
            "bio": doc.bio,
            "specialty_id": doc.specialty_id,
            "specialty_name": doc.specialty.name if doc.specialty else None,
            "is_active": doc.user.is_active
        })
    return results


@router.post("/doctors", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def create_doctor(doctor_in: DoctorCreate, db: Session = Depends(get_db)) -> dict:
    """
    Register a new doctor account, profile, and clinical specialty assignment.

    @param doctor_in: Doctor creation payload.
    @param db: Database session dependency.
    @return: Created doctor dictionary representation.
    """
    existing_user = db.query(User).filter(User.email == doctor_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered"
        )

    existing_license = db.query(Doctor).filter(Doctor.license_number == doctor_in.license_number).first()
    if existing_license:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Medical license number already registered"
        )

    specialty = db.query(Specialty).filter(Specialty.id == doctor_in.specialty_id).first()
    if not specialty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Selected specialty not found"
        )

    user = User(
        email=doctor_in.email,
        hashed_password=hash_password(doctor_in.password),
        full_name=doctor_in.full_name,
        phone_number=doctor_in.phone_number,
        role=UserRole.DOCTOR,
        is_active=True
    )
    db.add(user)
    db.flush()

    doctor = Doctor(
        user_id=user.id,
        specialty_id=specialty.id,
        license_number=doctor_in.license_number,
        bio=doctor_in.bio
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)

    return {
        "id": doctor.id,
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "phone_number": user.phone_number,
        "license_number": doctor.license_number,
        "bio": doctor.bio,
        "specialty_id": specialty.id,
        "specialty_name": specialty.name,
        "is_active": user.is_active
    }


@router.put("/doctors/{doctor_id}", response_model=DoctorResponse)
def update_doctor(
    doctor_id: int,
    doctor_update: DoctorUpdate,
    db: Session = Depends(get_db)
) -> dict:
    """
    Update clinical doctor credentials, specialty, or profile details.

    @param doctor_id: Target Doctor identifier.
    @param doctor_update: Fields to update.
    @param db: Database session dependency.
    @return: Updated doctor representation.
    """
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )

    if doctor_update.license_number and doctor_update.license_number != doctor.license_number:
        duplicate = db.query(Doctor).filter(
            Doctor.license_number == doctor_update.license_number,
            Doctor.id != doctor_id
        ).first()
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Medical license number already registered to another doctor"
            )
        doctor.license_number = doctor_update.license_number

    if doctor_update.specialty_id is not None:
        specialty = db.query(Specialty).filter(Specialty.id == doctor_update.specialty_id).first()
        if not specialty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected specialty not found"
            )
        doctor.specialty_id = specialty.id

    if doctor_update.bio is not None:
        doctor.bio = doctor_update.bio

    if doctor_update.full_name is not None:
        doctor.user.full_name = doctor_update.full_name

    if doctor_update.phone_number is not None:
        doctor.user.phone_number = doctor_update.phone_number

    db.commit()
    db.refresh(doctor)
    db.refresh(doctor.user)

    return {
        "id": doctor.id,
        "user_id": doctor.user_id,
        "email": doctor.user.email,
        "full_name": doctor.user.full_name,
        "phone_number": doctor.user.phone_number,
        "license_number": doctor.license_number,
        "bio": doctor.bio,
        "specialty_id": doctor.specialty_id,
        "specialty_name": doctor.specialty.name if doctor.specialty else None,
        "is_active": doctor.user.is_active
    }


@router.patch("/doctors/{doctor_id}/status", response_model=DoctorResponse)
def toggle_doctor_status(doctor_id: int, db: Session = Depends(get_db)) -> dict:
    """
    Toggle doctor active status (soft delete / reactivate).

    @param doctor_id: Target Doctor identifier.
    @param db: Database session dependency.
    @return: Updated doctor representation.
    """
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )

    doctor.user.is_active = not doctor.user.is_active
    db.commit()
    db.refresh(doctor.user)

    return {
        "id": doctor.id,
        "user_id": doctor.user_id,
        "email": doctor.user.email,
        "full_name": doctor.user.full_name,
        "phone_number": doctor.user.phone_number,
        "license_number": doctor.license_number,
        "bio": doctor.bio,
        "specialty_id": doctor.specialty_id,
        "specialty_name": doctor.specialty.name if doctor.specialty else None,
        "is_active": doctor.user.is_active
    }


@router.get("/doctors/{doctor_id}/shifts", response_model=list[ShiftResponse])
def get_doctor_shifts(doctor_id: int, db: Session = Depends(get_db)) -> list[DoctorShift]:
    """
    Retrieve all assigned weekly shifts for a specific doctor.

    @param doctor_id: Target doctor identifier.
    @param db: Database session dependency.
    @return: List of DoctorShift ORM instances.
    """
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    return db.query(DoctorShift).filter(DoctorShift.doctor_id == doctor_id).all()


def _time_to_minutes(t: time) -> int:
    return t.hour * 60 + t.minute


@router.post("/shifts", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
def create_shift(shift_in: ShiftCreate, db: Session = Depends(get_db)) -> DoctorShift:
    """
    Assign a weekly shift interval to a doctor enforcing daily rest periods and scheduling constraints.

    @param shift_in: Shift payload containing doctor_id, day, and time interval.
    @param db: Database session dependency.
    @return: Newly created DoctorShift record.
    """
    doctor = db.query(Doctor).filter(Doctor.id == shift_in.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )

    new_start_min = _time_to_minutes(shift_in.start_time)
    new_end_min = _time_to_minutes(shift_in.end_time)

    if new_start_min >= new_end_min:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shift start time must precede end time"
        )

    shift_duration_hours = (new_end_min - new_start_min) / 60.0

    existing_shifts = db.query(DoctorShift).filter(
        DoctorShift.doctor_id == shift_in.doctor_id
    ).all()

    new_day_idx = DAY_ORDER[shift_in.day_of_week]

    for s in existing_shifts:
        s_day_idx = DAY_ORDER[s.day_of_week]
        s_start_min = _time_to_minutes(s.start_time)
        s_end_min = _time_to_minutes(s.end_time)
        s_duration_hours = (s_end_min - s_start_min) / 60.0

        if s_day_idx == new_day_idx:
            if not (new_end_min <= s_start_min or new_start_min >= s_end_min):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Shift overlaps with an existing shift on {shift_in.day_of_week.value.capitalize()} ({s.start_time.strftime('%H:%M')} - {s.end_time.strftime('%H:%M')})"
                )

        if (s_day_idx + 1) % 7 == new_day_idx:
            if s_duration_hours >= 20.0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Mandatory 24h compensatory rest required following extended duty on {s.day_of_week.value.capitalize()}"
                )

            rest_minutes = (1440 - s_end_min) + new_start_min
            if rest_minutes < 720:
                rest_hours = round(rest_minutes / 60.0, 1)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient daily rest period ({rest_hours}h). Clinical labor norms require at least 12 consecutive hours between shifts on {s.day_of_week.value.capitalize()} and {shift_in.day_of_week.value.capitalize()}"
                )

        if (new_day_idx + 1) % 7 == s_day_idx:
            if shift_duration_hours >= 20.0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot schedule an extended shift prior to existing shift on {s.day_of_week.value.capitalize()}; 24h rest required"
                )

            rest_minutes = (1440 - new_end_min) + s_start_min
            if rest_minutes < 720:
                rest_hours = round(rest_minutes / 60.0, 1)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient daily rest period ({rest_hours}h). Shift ends too late to grant required 12h rest before scheduled shift on {s.day_of_week.value.capitalize()}"
                )

    shift = DoctorShift(
        doctor_id=shift_in.doctor_id,
        day_of_week=shift_in.day_of_week,
        start_time=shift_in.start_time,
        end_time=shift_in.end_time
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift


@router.delete("/shifts/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shift(shift_id: int, db: Session = Depends(get_db)) -> None:
    """
    Remove an assigned shift schedule.

    @param shift_id: Target DoctorShift identifier.
    @param db: Database session dependency.
    @return: None
    """
    shift = db.query(DoctorShift).filter(DoctorShift.id == shift_id).first()
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found"
        )
    db.delete(shift)
    db.commit()


@router.get("/vacations", response_model=list[VacationResponse])
def get_all_vacations(db: Session = Depends(get_db)) -> list[VacationRequest]:
    """
    Retrieve all vacation requests across all clinic doctors for administrative review.

    @param db: Database session dependency.
    @return: List of all submitted vacation requests.
    """
    return db.query(VacationRequest).order_by(VacationRequest.created_at.desc()).all()


@router.patch("/vacations/{vacation_id}/status", response_model=VacationResponse)
def update_vacation_status(
    vacation_id: int,
    status_in: VacationStatusUpdate,
    db: Session = Depends(get_db)
) -> VacationRequest:
    """
    Approve or reject a submitted doctor vacation request.

    @param vacation_id: Target VacationRequest identifier.
    @param status_in: Status update payload (APPROVED or REJECTED).
    @param db: Database session dependency.
    @return: Updated VacationRequest record.
    """
    vacation = db.query(VacationRequest).filter(VacationRequest.id == vacation_id).first()
    if not vacation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacation request not found"
        )

    vacation.status = status_in.status
    db.commit()
    db.refresh(vacation)
    return vacation
