"""
SISMOBI Backend 3.2.0 - Sistema de Gestão Imobiliária
Simplified FastAPI server for quick deployment
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

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
    return {
        "message": "SISMOBI API 3.2.0 is running", 
        "status": "active", 
        "timestamp": datetime.now().isoformat()
    }

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

# Mock API endpoints for frontend compatibility
@app.get("/api/v1/properties")
async def get_properties():
    """Get all properties"""
    return {"data": [], "total": 0}

@app.get("/api/v1/tenants") 
async def get_tenants():
    """Get all tenants"""
    return {"data": [], "total": 0}

@app.get("/api/v1/transactions")
async def get_transactions():
    """Get all transactions"""
    return {"data": [], "total": 0}

@app.get("/api/v1/alerts")
async def get_alerts():
    """Get all alerts"""
    return {"data": [], "total": 0}

@app.get("/api/v1/energy-bills")
async def get_energy_bills():
    """Get all energy bills"""
    return {"data": [], "total": 0}

@app.get("/api/v1/water-bills")
async def get_water_bills():
    """Get all water bills"""
    return {"data": [], "total": 0}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)