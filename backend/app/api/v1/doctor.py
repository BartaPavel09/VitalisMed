from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.models.doctor import Doctor
from app.models.shift import DoctorShift, VacationRequest, VacationStatus
from app.models.appointment import Appointment, AppointmentStatus
from app.models.rating import Rating
from app.schemas.doctor import (
    DoctorProfileResponse,
    ShiftItem,
    VacationCreate,
    VacationResponse,
    DoctorAppointmentResponse
)

router = APIRouter(dependencies=[Depends(require_roles([UserRole.DOCTOR]))])


def _get_current_doctor(db: Session, user: User) -> Doctor:
    """
    Retrieve Doctor profile entity associated with current authenticated user.

    @param db: Database session instance.
    @param user: Authenticated User instance.
    @return: Associated Doctor ORM model.
    """
    doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found for authenticated user"
        )
    return doctor


@router.get("/profile", response_model=DoctorProfileResponse)
def get_doctor_profile(
    current_user: User = Depends(require_roles([UserRole.DOCTOR])),
    db: Session = Depends(get_db)
) -> dict:
    """
    Retrieve doctor profile information along with personal aggregate rating score.

    @param current_user: Authenticated doctor user.
    @param db: Database session dependency.
    @return: Doctor profile dictionary with rating metrics.
    """
    doctor = _get_current_doctor(db, current_user)

    rating_data = db.query(
        func.coalesce(func.avg(Rating.score), 0.0),
        func.count(Rating.id)
    ).filter(Rating.doctor_id == doctor.id).first()

    avg_score = round(float(rating_data[0]), 2) if rating_data else 0.0
    total_count = int(rating_data[1]) if rating_data else 0

    return {
        "id": doctor.id,
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone_number": current_user.phone_number,
        "license_number": doctor.license_number,
        "bio": doctor.bio,
        "specialty_name": doctor.specialty.name if doctor.specialty else None,
        "average_rating": avg_score,
        "total_ratings": total_count
    }


@router.get("/shifts", response_model=list[ShiftItem])
def get_my_shifts(
    current_user: User = Depends(require_roles([UserRole.DOCTOR])),
    db: Session = Depends(get_db)
) -> list[DoctorShift]:
    """
    Retrieve assigned recurring weekly shifts for the active doctor.

    @param current_user: Authenticated doctor user.
    @param db: Database session dependency.
    @return: List of recurring weekly DoctorShift records.
    """
    doctor = _get_current_doctor(db, current_user)
    return db.query(DoctorShift).filter(DoctorShift.doctor_id == doctor.id).all()


@router.get("/vacations", response_model=list[VacationResponse])
def get_my_vacations(
    current_user: User = Depends(require_roles([UserRole.DOCTOR])),
    db: Session = Depends(get_db)
) -> list[VacationRequest]:
    """
    Retrieve vacation requests submitted by the active doctor.

    @param current_user: Authenticated doctor user.
    @param db: Database session dependency.
    @return: List of vacation requests ordered by submission date.
    """
    doctor = _get_current_doctor(db, current_user)
    return db.query(VacationRequest).filter(
        VacationRequest.doctor_id == doctor.id
    ).order_by(VacationRequest.created_at.desc()).all()


@router.post("/vacations", response_model=VacationResponse, status_code=status.HTTP_201_CREATED)
def submit_vacation_request(
    vacation_in: VacationCreate,
    current_user: User = Depends(require_roles([UserRole.DOCTOR])),
    db: Session = Depends(get_db)
) -> VacationRequest:
    """
    Submit a new vacation leave request for administrative review.

    @param vacation_in: Vacation payload containing date interval and optional justification.
    @param current_user: Authenticated doctor user.
    @param db: Database session dependency.
    @return: Created VacationRequest record in PENDING status.
    """
    doctor = _get_current_doctor(db, current_user)

    if vacation_in.start_date > vacation_in.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vacation start date must precede or equal end date"
        )

    vacation = VacationRequest(
        doctor_id=doctor.id,
        start_date=vacation_in.start_date,
        end_date=vacation_in.end_date,
        reason=vacation_in.reason,
        status=VacationStatus.PENDING
    )
    db.add(vacation)
    db.commit()
    db.refresh(vacation)
    return vacation


@router.get("/appointments", response_model=list[DoctorAppointmentResponse])
def get_doctor_appointments(
    current_user: User = Depends(require_roles([UserRole.DOCTOR])),
    db: Session = Depends(get_db)
) -> list[dict]:
    """
    Retrieve all consultations booked with the active doctor.

    @param current_user: Authenticated doctor user.
    @param db: Database session dependency.
    @return: List of appointment details with patient information.
    """
    doctor = _get_current_doctor(db, current_user)
    appts = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id
    ).order_by(Appointment.appointment_date.desc()).all()

    results = []
    for a in appts:
        results.append({
            "id": a.id,
            "patient_id": a.patient_id,
            "patient_name": a.patient.full_name,
            "patient_email": a.patient.email,
            "patient_phone": a.patient.phone_number,
            "appointment_date": a.appointment_date,
            "status": a.status,
            "symptoms": a.symptoms,
            "triage_urgency": a.triage_urgency,
            "created_at": a.created_at,
            "has_prescription": a.prescription is not None
        })
    return results


@router.patch("/appointments/{appointment_id}/accept", response_model=dict)
def accept_appointment(
    appointment_id: int,
    current_user: User = Depends(require_roles([UserRole.DOCTOR])),
    db: Session = Depends(get_db)
) -> dict:
    """
    Accept a pending consultation request.

    @param appointment_id: Target appointment identifier.
    @param current_user: Authenticated doctor user.
    @param db: Database session dependency.
    @return: Confirmation status payload.
    """
    doctor = _get_current_doctor(db, current_user)
    appt = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.doctor_id == doctor.id
    ).first()

    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )

    if appt.status != AppointmentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot accept appointment with status '{appt.status.value}'"
        )

    appt.status = AppointmentStatus.ACCEPTED
    db.commit()
    return {"id": appt.id, "status": appt.status.value}


@router.patch("/appointments/{appointment_id}/decline", response_model=dict)
def decline_appointment(
    appointment_id: int,
    current_user: User = Depends(require_roles([UserRole.DOCTOR])),
    db: Session = Depends(get_db)
) -> dict:
    """
    Decline an appointment up to one day in advance (24-hour deadline rule).

    @param appointment_id: Target appointment identifier.
    @param current_user: Authenticated doctor user.
    @param db: Database session dependency.
    @return: Confirmation status payload.
    """
    doctor = _get_current_doctor(db, current_user)
    appt = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.doctor_id == doctor.id
    ).first()

    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )

    now = datetime.now(timezone.utc)
    appt_time = appt.appointment_date
    if appt_time.tzinfo is None:
        appt_time = appt_time.replace(tzinfo=timezone.utc)

    if now > appt_time - timedelta(hours=24):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointments cannot be declined less than 24 hours prior to scheduled time"
        )

    if appt.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot decline an appointment that is already completed or cancelled"
        )

    appt.status = AppointmentStatus.DECLINED
    db.commit()
    return {"id": appt.id, "status": appt.status.value}


@router.patch("/appointments/{appointment_id}/complete", response_model=dict)
def complete_appointment(
    appointment_id: int,
    current_user: User = Depends(require_roles([UserRole.DOCTOR])),
    db: Session = Depends(get_db)
) -> dict:
    """
    Mark an accepted appointment as completed.

    @param appointment_id: Target appointment identifier.
    @param current_user: Authenticated doctor user.
    @param db: Database session dependency.
    @return: Confirmation status payload.
    """
    doctor = _get_current_doctor(db, current_user)
    appt = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.doctor_id == doctor.id
    ).first()

    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )

    if appt.status != AppointmentStatus.ACCEPTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot complete appointment with status '{appt.status.value}'. Must be accepted first."
        )

    appt.status = AppointmentStatus.COMPLETED
    db.commit()
    return {"id": appt.id, "status": appt.status.value}
