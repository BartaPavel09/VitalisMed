from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from app.models.user import UserRole
from app.schemas.validators import validate_phone_number


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone_number: str | None = None


class UserCreate(UserBase):
    password: str

    @field_validator("phone_number")
    @classmethod
    def check_phone_number(cls, v: str | None) -> str | None:
        return validate_phone_number(v)


class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
