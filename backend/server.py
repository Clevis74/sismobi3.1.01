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
    docs_url="/api/docs" if settings.debug else None,
    redoc_url="/api/redoc" if settings.debug else None,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Event handlers
@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    try:
        logger.info("Starting SISMOBI Backend 3.2.0")
        await connect_to_mongo()
        logger.info("SISMOBI Backend started successfully")
    except Exception as e:
        logger.error("Failed to start backend", error=str(e))
        # Don't exit in production, just log the error
        if settings.debug:
            sys.exit(1)

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    try:
        logger.info("Shutting down SISMOBI Backend")
        await close_mongo_connection()
        logger.info("SISMOBI Backend shutdown complete")
    except Exception as e:
        logger.error("Error during shutdown", error=str(e))

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(properties.router, prefix="/api/v1")
app.include_router(tenants.router, prefix="/api/v1")

# Root endpoints
@app.get("/")
async def read_root():
    """Root endpoint"""
    return {
        "message": "SISMOBI Backend 3.2.0 is running",
        "version": "3.2.0",
        "timestamp": datetime.now().isoformat(),
        "docs": "/api/docs" if settings.debug else "disabled"
    }

@app.get("/api/health", response_model=HealthResponse)
async def health_check(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Health check endpoint"""
    try:
        # Test database connection
        await db.command("ping")
        database_status = "connected"
    except Exception as e:
        logger.error("Database health check failed", error=str(e))
        database_status = "disconnected"
    
    return HealthResponse(
        status="healthy" if database_status == "connected" else "unhealthy",
        database_status=database_status
    )

@app.get("/api/v1/dashboard/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    current_user = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get dashboard summary statistics"""
    try:
        summary_data = await calculate_dashboard_summary(db)
        logger.info("Dashboard summary retrieved", user=current_user.email)
        return DashboardSummary(**summary_data)
    except Exception as e:
        logger.error("Error getting dashboard summary", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error("Unhandled exception", 
                error=str(exc), 
                path=request.url.path,
                method=request.method)
    
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error", "status": "error"}
    )

# Custom middleware for request logging
@app.middleware("http")
async def log_requests(request, call_next):
    """Log all HTTP requests"""
    start_time = datetime.now()
    
    response = await call_next(request)
    
    process_time = (datetime.now() - start_time).total_seconds()
    
    logger.info("HTTP request",
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                process_time=process_time)
    
    return response

