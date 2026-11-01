
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from ai_service import analyze_complaint
import models

from database import engine, Base, get_db
from schemas import (
    UserRegister,
    UserResponse,
    UserLogin,
    TokenResponse,
    ComplaintCreate,
    ComplaintResponse,
    ComplaintStatusUpdate
)
from auth import register_user, login_user
from dependencies import get_current_user, get_current_admin

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="JanAwaaz CivicTrack AI",
    description="Civic Grievance Management API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Welcome to JanAwaaz CivicTrack AI",
        "status": "Backend is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "JanAwaaz API"
    }


@app.get("/test-db")
def test_database():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "success",
            "message": "PostgreSQL connected successfully!"
        }

    except Exception:
        return {
            "status": "error",
            "message": "Database connection failed"
        }


@app.post("/register", response_model=UserResponse, status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    return register_user(data, db)


@app.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    return login_user(data, db)




@app.post(
    "/complaints",
    response_model=ComplaintResponse,
    status_code=201
)
def create_complaint(
    data: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Gemini AI analyses the complaint
    ai_result = analyze_complaint(
        title=data.title,
        description=data.description,
        location=data.location
    )

    new_complaint = models.Complaint(
        title=data.title,
        description=data.description,
        location=data.location,
        category=ai_result["category"],
        severity=ai_result["severity"],
        ai_reason=ai_result["reason"],
        user_id=current_user.id
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    return new_complaint


@app.get("/my-complaints", response_model=list[ComplaintResponse])
def get_my_complaints(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    complaints = db.query(models.Complaint).filter(
        models.Complaint.user_id == current_user.id
    ).order_by(
        models.Complaint.created_at.desc()
    ).all()

    return complaints
@app.get("/complaints/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    complaint = db.query(models.Complaint).filter(
        models.Complaint.id == complaint_id,
        models.Complaint.user_id == current_user.id
    ).first()

    if complaint is None:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    return complaint
@app.get("/admin/dashboard")
def admin_dashboard(
    current_user: models.User = Depends(get_current_admin)
):
    return {
        "message": "Welcome to Admin Dashboard",
        "admin": current_user.name,
        "role": current_user.role
    }
@app.get(
    "/admin/complaints",
    response_model=list[ComplaintResponse]
)
def get_all_complaints(
    category: str | None = None,
    status: str | None = None,
    severity: str | None = None,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    query = db.query(models.Complaint)

    if category:
        query = query.filter(
            models.Complaint.category == category
        )

    if status:
        query = query.filter(
            models.Complaint.status == status
        )

    if severity:
        query = query.filter(
            models.Complaint.severity == severity
        )

    complaints = query.order_by(
        models.Complaint.created_at.desc()
    ).all()

    return complaints

def get_all_complaints(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    complaints = db.query(models.Complaint).order_by(
        models.Complaint.created_at.desc()
    ).all()

    return complaints
@app.patch("/admin/complaints/{complaint_id}")
def update_complaint_status(
    complaint_id: int,
    data: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    complaint = db.query(models.Complaint).filter(
        models.Complaint.id == complaint_id
    ).first()

    if complaint is None:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    complaint.status = data.status

    db.commit()
    db.refresh(complaint)

    return {
        "message": "Complaint status updated successfully",
        "complaint": complaint
    }