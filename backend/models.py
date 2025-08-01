"""
Pydantic models for SISMOBI 3.2.0
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

# Enums
class PropertyStatus(str, Enum):
    vacant = "vacant"
    rented = "rented"
    maintenance = "maintenance"

class TenantStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    pending = "pending"

class TransactionType(str, Enum):
    income = "income"
    expense = "expense"

class AlertType(str, Enum):
    rent_due = "rent_due"
    maintenance = "maintenance"
    contract_expiring = "contract_expiring"
    payment_overdue = "payment_overdue"
    high_energy_bill = "high_energy_bill"
    high_water_bill = "high_water_bill"

class DocumentType(str, Enum):
    contract = "contract"
    invoice = "invoice"
    receipt = "receipt"
    report = "report"
    other = "other"

# Base Models
class BaseDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# Property Models
class PropertyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    address: str = Field(..., min_length=1, max_length=500)
    type: str = Field(..., min_length=1, max_length=100)
    size: float = Field(..., gt=0)
    rooms: int = Field(..., gt=0)
    rent_value: float = Field(..., ge=0)
    expenses: float = Field(default=0, ge=0)
    status: PropertyStatus = PropertyStatus.vacant
    description: Optional[str] = Field(None, max_length=1000)

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    address: Optional[str] = Field(None, min_length=1, max_length=500)
    type: Optional[str] = Field(None, min_length=1, max_length=100)
    size: Optional[float] = Field(None, gt=0)
    rooms: Optional[int] = Field(None, gt=0)
    rent_value: Optional[float] = Field(None, ge=0)
    expenses: Optional[float] = Field(None, ge=0)
    status: Optional[PropertyStatus] = None
    description: Optional[str] = Field(None, max_length=1000)

class Property(PropertyBase, BaseDocument):
    tenant_id: Optional[str] = None

# Tenant Models
class TenantBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    phone: str = Field(..., min_length=1, max_length=50)
    document: str = Field(..., min_length=1, max_length=50)
    property_id: Optional[str] = None
    rent_value: float = Field(default=0, ge=0)
    rent_due_date: int = Field(..., ge=1, le=31)
    status: TenantStatus = TenantStatus.active
    notes: Optional[str] = Field(None, max_length=1000)

class TenantCreate(TenantBase):
    pass

class TenantUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    email: Optional[str] = Field(None, pattern=r'^[^@]+@[^@]+\.[^@]+$')
    phone: Optional[str] = Field(None, min_length=1, max_length=50)
    document: Optional[str] = Field(None, min_length=1, max_length=50)
    property_id: Optional[str] = None
    rent_value: Optional[float] = Field(None, ge=0)
    rent_due_date: Optional[int] = Field(None, ge=1, le=31)
    status: Optional[TenantStatus] = None
    notes: Optional[str] = Field(None, max_length=1000)

class Tenant(TenantBase, BaseDocument):
    pass

# Transaction Models
class TransactionBase(BaseModel):
    property_id: str
    tenant_id: Optional[str] = None
    description: str = Field(..., min_length=1, max_length=500)
    amount: float = Field(..., gt=0)
    type: TransactionType
    category: str = Field(..., min_length=1, max_length=100)
    date: datetime
    recurring: bool = False
    recurring_day: Optional[int] = Field(None, ge=1, le=31)
    notes: Optional[str] = Field(None, max_length=1000)

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    property_id: Optional[str] = None
    tenant_id: Optional[str] = None
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[TransactionType] = None
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    date: Optional[datetime] = None
    recurring: Optional[bool] = None
    recurring_day: Optional[int] = Field(None, ge=1, le=31)
    notes: Optional[str] = Field(None, max_length=1000)

class Transaction(TransactionBase, BaseDocument):
    pass

# Alert Models
class AlertBase(BaseModel):
    property_id: Optional[str] = None
    tenant_id: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=1000)
    type: AlertType
    priority: str = Field(default="medium", regex=r'^(low|medium|high|critical)$')
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    due_date: Optional[datetime] = None

class AlertCreate(AlertBase):
    pass

class AlertUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    message: Optional[str] = Field(None, min_length=1, max_length=1000)
    type: Optional[AlertType] = None
    priority: Optional[str] = Field(None, regex=r'^(low|medium|high|critical)$')
    resolved: Optional[bool] = None
    resolved_at: Optional[datetime] = None
    due_date: Optional[datetime] = None

class Alert(AlertBase, BaseDocument):
    pass

# Document Models
class DocumentBase(BaseModel):
    property_id: Optional[str] = None
    tenant_id: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=200)
    type: DocumentType
    file_path: str = Field(..., min_length=1, max_length=500)
    file_size: int = Field(..., gt=0)
    mime_type: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    type: Optional[DocumentType] = None
    description: Optional[str] = Field(None, max_length=1000)

class Document(DocumentBase, BaseDocument):
    pass

# Energy Bill Models
class EnergyBillBase(BaseModel):
    property_id: str
    group_id: str
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=3000)
    total_amount: float = Field(..., gt=0)
    total_kwh: float = Field(..., gt=0)
    reading_date: datetime
    due_date: datetime
    tenant_allocations: Dict[str, float] = Field(default_factory=dict)

class EnergyBillCreate(EnergyBillBase):
    pass

class EnergyBillUpdate(BaseModel):
    total_amount: Optional[float] = Field(None, gt=0)
    total_kwh: Optional[float] = Field(None, gt=0)
    reading_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    tenant_allocations: Optional[Dict[str, float]] = None

class EnergyBill(EnergyBillBase, BaseDocument):
    pass

# Water Bill Models
class WaterBillBase(BaseModel):
    property_id: str
    group_id: str
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=3000)
    total_amount: float = Field(..., gt=0)
    total_liters: float = Field(..., gt=0)
    reading_date: datetime
    due_date: datetime
    tenant_allocations: Dict[str, float] = Field(default_factory=dict)

class WaterBillCreate(WaterBillBase):
    pass

class WaterBillUpdate(BaseModel):
    total_amount: Optional[float] = Field(None, gt=0)
    total_liters: Optional[float] = Field(None, gt=0)
    reading_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    tenant_allocations: Optional[Dict[str, float]] = None

class WaterBill(WaterBillBase, BaseDocument):
    pass

# User Models (for authentication)
class UserBase(BaseModel):
    email: str = Field(..., regex=r'^[^@]+@[^@]+\.[^@]+$')
    full_name: str = Field(..., min_length=1, max_length=200)
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)

class UserUpdate(BaseModel):
    email: Optional[str] = Field(None, regex=r'^[^@]+@[^@]+\.[^@]+$')
    full_name: Optional[str] = Field(None, min_length=1, max_length=200)
    is_active: Optional[bool] = None

class User(UserBase, BaseDocument):
    hashed_password: str

# Authentication Models
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

# Response Models
class MessageResponse(BaseModel):
    message: str
    status: str = "success"

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime = Field(default_factory=datetime.now)
    version: str = "3.2.0"
    database_status: str

# Dashboard Summary
class DashboardSummary(BaseModel):
    total_properties: int
    total_tenants: int
    occupied_properties: int
    vacant_properties: int
    total_monthly_income: float
    total_monthly_expenses: float
    pending_alerts: int
    recent_transactions: List[Transaction]