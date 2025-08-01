"""
Tenant management routes for SISMOBI 3.2.0
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog
import uuid

from database import get_database
from models import Tenant, TenantCreate, TenantUpdate, MessageResponse, User
from auth import get_current_active_user
from utils import get_paginated_results, convert_objectid_to_str, validate_property_exists

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/tenants", tags=["tenants"])

@router.get("/", response_model=dict)
async def get_tenants(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    property_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all tenants with pagination and filters"""
    try:
        filter_dict = {}
        if status:
            filter_dict["status"] = status
        if property_id:
            filter_dict["property_id"] = property_id
            
        result = await get_paginated_results(
            db.tenants, filter_dict, page, page_size, "created_at", -1
        )
        
        logger.info("Tenants retrieved", count=len(result["items"]), user=current_user.email)
        return result
        
    except Exception as e:
        logger.error("Error retrieving tenants", error=str(e), user=current_user.email)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{tenant_id}", response_model=Tenant)
async def get_tenant(
    tenant_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get specific tenant by ID"""
    try:
        tenant_doc = await db.tenants.find_one({"id": tenant_id})
        if not tenant_doc:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        tenant_data = convert_objectid_to_str(tenant_doc)
        logger.info("Tenant retrieved", tenant_id=tenant_id, user=current_user.email)
        return Tenant(**tenant_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error retrieving tenant", tenant_id=tenant_id, error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/", response_model=Tenant)
async def create_tenant(
    tenant_data: TenantCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create new tenant"""
    try:
        # Validate property exists if provided
        if tenant_data.property_id:
            property_exists = await validate_property_exists(db, tenant_data.property_id)
            if not property_exists:
                raise HTTPException(status_code=400, detail="Property not found")
        
        # Check for duplicate email
        existing_tenant = await db.tenants.find_one({"email": tenant_data.email})
        if existing_tenant:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Convert to dict and add metadata
        tenant_dict = tenant_data.dict()
        tenant_dict.update({
            "id": str(uuid.uuid4()),
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        })
        
        result = await db.tenants.insert_one(tenant_dict)
        created_tenant = await db.tenants.find_one({"_id": result.inserted_id})
        
        # Update property status if tenant is assigned
        if tenant_data.property_id:
            await db.properties.update_one(
                {"id": tenant_data.property_id},
                {"$set": {"status": "rented", "tenant_id": tenant_dict["id"], "updated_at": datetime.now()}}
            )
        
        tenant_response = convert_objectid_to_str(created_tenant)
        logger.info("Tenant created", tenant_id=tenant_response["id"], user=current_user.email)
        return Tenant(**tenant_response)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error creating tenant", error=str(e), user=current_user.email)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{tenant_id}", response_model=Tenant)
async def update_tenant(
    tenant_id: str,
    tenant_updates: TenantUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update existing tenant"""
    try:
        # Check if tenant exists
        existing_tenant = await db.tenants.find_one({"id": tenant_id})
        if not existing_tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        # Validate new property if provided
        if tenant_updates.property_id:
            property_exists = await validate_property_exists(db, tenant_updates.property_id)
            if not property_exists:
                raise HTTPException(status_code=400, detail="Property not found")
        
        # Prepare update data
        update_data = {k: v for k, v in tenant_updates.dict().items() if v is not None}
        if update_data:
            update_data["updated_at"] = datetime.now()
            
            await db.tenants.update_one(
                {"id": tenant_id},
                {"$set": update_data}
            )
        
        # Handle property updates
        old_property_id = existing_tenant.get("property_id")
        new_property_id = tenant_updates.property_id
        
        if old_property_id != new_property_id:
            # Update old property status
            if old_property_id:
                await db.properties.update_one(
                    {"id": old_property_id},
                    {"$set": {"status": "vacant", "tenant_id": None, "updated_at": datetime.now()}}
                )
            
            # Update new property status
            if new_property_id:
                await db.properties.update_one(
                    {"id": new_property_id},
                    {"$set": {"status": "rented", "tenant_id": tenant_id, "updated_at": datetime.now()}}
                )
        
        updated_tenant = await db.tenants.find_one({"id": tenant_id})
        tenant_response = convert_objectid_to_str(updated_tenant)
        
        logger.info("Tenant updated", tenant_id=tenant_id, user=current_user.email)
        return Tenant(**tenant_response)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating tenant", tenant_id=tenant_id, error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{tenant_id}", response_model=MessageResponse)
async def delete_tenant(
    tenant_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete tenant and update related data"""
    try:
        # Check if tenant exists
        existing_tenant = await db.tenants.find_one({"id": tenant_id})
        if not existing_tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        # Update property status if tenant was assigned
        if existing_tenant.get("property_id"):
            await db.properties.update_one(
                {"id": existing_tenant["property_id"]},
                {"$set": {"status": "vacant", "tenant_id": None, "updated_at": datetime.now()}}
            )
        
        # Delete related data
        await db.transactions.delete_many({"tenant_id": tenant_id})
        await db.alerts.delete_many({"tenant_id": tenant_id})
        await db.documents.delete_many({"tenant_id": tenant_id})
        
        # Delete tenant
        await db.tenants.delete_one({"id": tenant_id})
        
        logger.info("Tenant deleted", tenant_id=tenant_id, user=current_user.email)
        return {"message": "Tenant deleted successfully", "status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error deleting tenant", tenant_id=tenant_id, error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")