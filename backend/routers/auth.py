"""
Authentication routes for SISMOBI 3.2.0
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from database import get_database
from models import Token, User, UserCreate, UserResponse, MessageResponse
from auth import authenticate_user, create_access_token, create_user, get_current_active_user
from config import settings

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Login endpoint to get access token"""
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    logger.info("User logged in successfully", email=user.email)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=MessageResponse)
async def register(
    user_data: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Register new user"""
    await create_user(db, user_data.email, user_data.password, user_data.full_name)
    
    logger.info("User registered successfully", email=user_data.email)
    return {"message": "User registered successfully", "status": "success"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    # Return safe user data without hashed_password
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )

@router.get("/verify", response_model=MessageResponse)
async def verify_token(current_user: User = Depends(get_current_active_user)):
    """Verify if token is valid"""
    return {"message": "Token is valid", "status": "success"}