"""
SISMOBI Backend 3.2.0 - Sistema de Gestão Imobiliária
Simplified FastAPI server for quick deployment
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI application
app = FastAPI(title="SISMOBI API", version="3.2.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "SISMOBI API is running"}

@app.get("/api/v1/properties")
def get_properties():
    return {"data": [], "total": 0}

@app.get("/api/v1/tenants")
def get_tenants():
    return {"data": [], "total": 0}

@app.get("/api/v1/energy-bills")
def get_energy_bills():
    return {"data": [], "total": 0}

@app.get("/api/v1/water-bills")
def get_water_bills():
    return {"data": [], "total": 0}

@app.get("/api/v1/transactions")
def get_transactions():
    return {"data": [], "total": 0}

@app.get("/api/v1/alerts")
def get_alerts():
    return {"data": [], "total": 0}

@app.get("/api/v1/auth/verify")
def auth_verify():
    return {"valid": False, "user": None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)