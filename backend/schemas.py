
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
class ComplaintCreate(BaseModel):
    title: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=10)
    location: str = Field(min_length=3, max_length=255)
    category: str | None = None


class ComplaintResponse(BaseModel):
    id: int
    title: str
    description: str
    location: str
    category: str | None
    severity: str
    status: str
    user_id: int
    ai_reason: str | None = None

    class Config:
        from_attributes = True
class ComplaintStatusUpdate(BaseModel):
    status: str = Field(
        pattern="^(submitted|in_progress|resolved)$"
    )