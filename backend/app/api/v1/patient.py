from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.models.doctor import Doctor, Specialty
from app.models.shift import DoctorShift, VacationRequest, VacationStatus, DayOfWeek
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.patient import (
    PublicDoctorInfo,
    AppointmentCreate,
    PatientAppointmentResponse
)

router = APIRouter(dependencies=[Depends(require_roles([UserRole.PATIENT]))])

WEEKDAY_MAP = {
    0: DayOfWeek.MONDAY,
    1: DayOfWeek.TUESDAY,
    2: DayOfWeek.WEDNESDAY,
    3: DayOfWeek.THURSDAY,
    4: DayOfWeek.FRIDAY,
    5: DayOfWeek.SATURDAY,
    6: DayOfWeek.SUNDAY
}


@router.get("/doctors", response_model=list[PublicDoctorInfo])
def get_available_doctors(
    specialty_id: int | None = None,
    db: Session = Depends(get_db)
) -> list[dict]:
    """
    Retrieve active clinic doctors, including their weekly shifts and approved vacation dates.

    @param specialty_id: Optional specialty filter.
    @param db: Database session dependency.
    @return: List of doctors with scheduling availability.
    """
    query = db.query(Doctor).join(User).filter(User.is_active == True)
    if specialty_id:
        query = query.filter(Doctor.specialty_id == specialty_id)

    doctors = query.all()
    results = []

    for doc in doctors:
        shifts = db.query(DoctorShift).filter(DoctorShift.doctor_id == doc.id).all()
        vacations = db.query(VacationRequest).filter(
            VacationRequest.doctor_id == doc.id,
            VacationRequest.status == VacationStatus.APPROVED
        ).all()

        results.append({
            "id": doc.id,
            "full_name": doc.user.full_name,
            "email": doc.user.email,
            "phone_number": doc.user.phone_number,
            "license_number": doc.license_number,
            "bio": doc.bio,
            "specialty_id": doc.specialty_id,
            "specialty_name": doc.specialty.name if doc.specialty else "General",
            "shifts": shifts,
            "vacations": [{"start_date": v.start_date, "end_date": v.end_date} for v in vacations]
        })

    return results


@router.get("/appointments", response_model=list[PatientAppointmentResponse])
def get_my_appointments(
    current_user: User = Depends(require_roles([UserRole.PATIENT])),
    db: Session = Depends(get_db)
) -> list[dict]:
    """
    Retrieve all appointments booked by the active patient.

    @param current_user: Authenticated patient user.
    @param db: Database session dependency.
    @return: List of patient appointment records with cancellation eligibility.
    """
    appts = db.query(Appointment).filter(
        Appointment.patient_id == current_user.id
    ).order_by(Appointment.appointment_date.desc()).all()

    now = datetime.now(timezone.utc)
    results = []

    for a in appts:
        appt_time = a.appointment_date
        if appt_time.tzinfo is None:
            appt_time = appt_time.replace(tzinfo=timezone.utc)

        can_cancel = (
            a.status in [AppointmentStatus.PENDING, AppointmentStatus.ACCEPTED]
            and now <= appt_time - timedelta(hours=24)
        )

        has_prescription = a.prescription is not None
        diagnosis = a.prescription.diagnosis if has_prescription else None
        medication_instructions = a.prescription.medication_instructions if has_prescription else None

        results.append({
            "id": a.id,
            "doctor_id": a.doctor_id,
            "doctor_name": a.doctor.user.full_name,
            "specialty_name": a.doctor.specialty.name if a.doctor.specialty else "General",
            "appointment_date": a.appointment_date,
            "status": a.status,
            "symptoms": a.symptoms,
            "triage_urgency": a.triage_urgency,
            "created_at": a.created_at,
            "can_cancel": can_cancel,
            "has_prescription": has_prescription,
            "diagnosis": diagnosis,
            "medication_instructions": medication_instructions
        })

    return results


@router.post("/appointments", response_model=PatientAppointmentResponse, status_code=status.HTTP_201_CREATED)
def book_appointment(
    appt_in: AppointmentCreate,
    current_user: User = Depends(require_roles([UserRole.PATIENT])),
    db: Session = Depends(get_db)
) -> dict:
    """
    Book a new clinical appointment verifying doctor shifts, approved vacations, and 24h cancellation rule.

    @param appt_in: Appointment booking payload.
    @param current_user: Authenticated patient user.
    @param db: Database session dependency.
    @return: Created appointment representation.
    """
    doctor = db.query(Doctor).filter(Doctor.id == appt_in.doctor_id).first()
    if not doctor or not doctor.user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not available for appointments"
        )

    appt_time = appt_in.appointment_date
    if appt_time.tzinfo is None:
        appt_time = appt_time.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    if appt_time <= now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment date must be scheduled in the future"
        )

    appt_date_only = appt_time.date()
    vacation = db.query(VacationRequest).filter(
        VacationRequest.doctor_id == doctor.id,
        VacationRequest.status == VacationStatus.APPROVED,
        VacationRequest.start_date <= appt_date_only,
        VacationRequest.end_date >= appt_date_only
    ).first()

    if vacation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor is on approved vacation during the selected date"
        )

    weekday_enum = WEEKDAY_MAP[appt_time.weekday()]
    appt_time_only = appt_time.time()

    shift = db.query(DoctorShift).filter(
        DoctorShift.doctor_id == doctor.id,
        DoctorShift.day_of_week == weekday_enum,
        DoctorShift.start_time <= appt_time_only,
        DoctorShift.end_time > appt_time_only
    ).first()

    if not shift:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Doctor does not have active clinical shift hours at the selected time on {weekday_enum.value.capitalize()}"
        )

    conflict = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.ACCEPTED]),
        Appointment.appointment_date == appt_time
    ).first()

    if conflict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor already has an appointment scheduled at this exact time"
        )

    appointment = Appointment(
        patient_id=current_user.id,
        doctor_id=doctor.id,
        appointment_date=appt_time,
        status=AppointmentStatus.PENDING,
        symptoms=appt_in.symptoms
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return {
        "id": appointment.id,
        "doctor_id": doctor.id,
        "doctor_name": doctor.user.full_name,
        "specialty_name": doctor.specialty.name if doctor.specialty else "General",
        "appointment_date": appointment.appointment_date,
        "status": appointment.status,
        "symptoms": appointment.symptoms,
        "triage_urgency": appointment.triage_urgency,
        "created_at": appointment.created_at,
        "can_cancel": True,
        "has_prescription": False,
        "diagnosis": None,
        "medication_instructions": None
    }


@router.patch("/appointments/{appointment_id}/cancel", response_model=dict)
def cancel_appointment(
    appointment_id: int,
    current_user: User = Depends(require_roles([UserRole.PATIENT])),
    db: Session = Depends(get_db)
) -> dict:
    """
    Cancel an appointment up to 24 hours in advance. Cancellation is strictly prohibited under 24 hours.

    @param appointment_id: Target appointment identifier.
    @param current_user: Authenticated patient user.
    @param db: Database session dependency.
    @return: Confirmation message.
    """
    appt = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.patient_id == current_user.id
    ).first()

    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )

    if appt.status not in [AppointmentStatus.PENDING, AppointmentStatus.ACCEPTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel appointment with status '{appt.status.value}'"
        )

    now = datetime.now(timezone.utc)
    appt_time = appt.appointment_date
    if appt_time.tzinfo is None:
        appt_time = appt_time.replace(tzinfo=timezone.utc)

    if now > appt_time - timedelta(hours=24):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointments can only be cancelled up to 24 hours in advance"
        )

    appt.status = AppointmentStatus.CANCELLED
    db.commit()

    return {"id": appt.id, "status": appt.status.value, "message": "Appointment cancelled successfully"}
