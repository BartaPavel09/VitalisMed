from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.models.doctor import Doctor, Specialty
from app.models.shift import DoctorShift
from app.schemas.admin import (
    DoctorCreate,
    DoctorResponse,
    SpecialtyCreate,
    SpecialtyResponse,
    ShiftCreate,
    ShiftResponse
)

router = APIRouter(dependencies=[Depends(require_roles([UserRole.ADMIN]))])


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


@router.post("/shifts", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
def create_shift(shift_in: ShiftCreate, db: Session = Depends(get_db)) -> DoctorShift:
    """
    Assign a weekly shift interval to a doctor.

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

    if shift_in.start_time >= shift_in.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shift start time must precede end time"
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
