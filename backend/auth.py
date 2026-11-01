
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models import User
from schemas import UserRegister, UserLogin
from security import hash_password, verify_password, create_access_token


def register_user(user_data: UserRegister, db: Session):
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email is already registered"
        )

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=hash_password(user_data.password),
        role="citizen"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def login_user(user_data: UserLogin, db: Session):
    user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if not user or not verify_password(
        user_data.password, user.password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
    
    
