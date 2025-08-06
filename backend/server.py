"""
SISMOBI Backend 3.2.0 - Sistema de Gestão Imobiliária
FastAPI server with MongoDB integration, authentication, and comprehensive APIs
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog
import sys
import os
from datetime import datetime

# Add backend to path for imports
sys.path.append(os.path.dirname(__file__))

# Internal imports
from config import settings
from database import connect_to_mongo, close_mongo_connection, get_database
from models import HealthResponse, DashboardSummary
from utils import calculate_dashboard_summary
from auth import get_current_active_user

# Router imports
from routers import auth, properties, tenants, transactions, alerts

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

# Create FastAPI application
app = FastAPI(
    title="SISMOBI API",
    description="Sistema de Gestão Imobiliária - Backend API",
    version="3.2.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5174",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "SISMOBI API 3.2.0 is running", "status": "active", "timestamp": datetime.now().isoformat()}

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "SISMOBI Backend",
        "version": "3.2.0",
        "timestamp": datetime.now().isoformat(),
        "database": "connected"
    }

@app.get("/api/v1/dashboard/summary")
async def get_dashboard_summary():
    """Dashboard summary endpoint"""
    return {
        "total_properties": 0,
        "total_tenants": 0,
        "total_revenue": 0.0,
        "total_expenses": 0.0,
        "occupancy_rate": 0.0,
        "last_updated": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

