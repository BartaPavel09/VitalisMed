import sys
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_path))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.doctor import Specialty

INITIAL_SPECIALTIES = [
    {
        "name": "General Medicine",
        "description": "Primary healthcare, diagnosis of common acute and chronic illnesses."
    },
    {
        "name": "Cardiology",
        "description": "Comprehensive diagnosis, prevention, and treatment of heart and cardiovascular diseases."
    },
    {
        "name": "Neurology",
        "description": "Specialized medical evaluation and care for disorders of the brain and nervous system."
    },
    {
        "name": "Dermatology",
        "description": "Expert diagnosis and treatment of conditions affecting the skin, hair, and nails."
    },
    {
        "name": "Pediatrics",
        "description": "Dedicated and preventative medical care for children."
    },
    {
        "name": "Orthopedics",
        "description": "Care and treatment of injuries and diseases affecting bones, joints, and ligaments."
    }
]


def seed_admin_user(db: Session) -> None:
    """
    Ensure a default administrator account exists in the database.

    @param db: Database session instance.
    @return: None
    """
    admin_email = "admin@vitalismed.com"
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if not existing_admin:
        admin_user = User(
            email=admin_email,
            hashed_password=hash_password("Admin123!"),
            full_name="VitalisMed Administrator",
            phone_number="+40700000000",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)
        db.commit()


def seed_specialties(db: Session) -> None:
    """
    Ensure core clinical medical specialties exist in the database.

    @param db: Database session instance.
    @return: None
    """
    for item in INITIAL_SPECIALTIES:
        existing = db.query(Specialty).filter(Specialty.name == item["name"]).first()
        if not existing:
            specialty = Specialty(
                name=item["name"],
                description=item["description"]
            )
            db.add(specialty)
    db.commit()


def main() -> None:
    """
    Execute all database seeding routines sequentially.

    @return: None
    """
    db = SessionLocal()
    try:
        seed_admin_user(db)
        seed_specialties(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
