"""
Property management routes for SISMOBI 3.2.0
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog

from database import get_database
from models import Property, PropertyCreate, PropertyUpdate, MessageResponse, User
from auth import get_current_active_user
from utils import get_paginated_results, convert_objectid_to_str, create_property_filter

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/properties", tags=["properties"])

@router.get("/", response_model=dict)
async def get_properties(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    min_rent: Optional[float] = Query(None, ge=0),
    max_rent: Optional[float] = Query(None, ge=0),
    property_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all properties with pagination and filters"""
    try:
        filter_dict = create_property_filter(status, min_rent, max_rent, property_type)
        result = await get_paginated_results(
            db.properties, filter_dict, page, page_size, "created_at", -1
        )
        
        logger.info("Properties retrieved", count=len(result["items"]), user=current_user.email)
        return result
        
    except Exception as e:
        logger.error("Error retrieving properties", error=str(e), user=current_user.email)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{property_id}", response_model=Property)
async def get_property(
    property_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get specific property by ID"""
    try:
        property_doc = await db.properties.find_one({"id": property_id})
        if not property_doc:
            raise HTTPException(status_code=404, detail="Property not found")
        
        property_data = convert_objectid_to_str(property_doc)
        logger.info("Property retrieved", property_id=property_id, user=current_user.email)
        return Property(**property_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error retrieving property", property_id=property_id, error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/", response_model=Property)
async def create_property(
    property_data: PropertyCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create new property"""
    try:
        # Convert to dict and add metadata
        property_dict = property_data.dict()
        from datetime import datetime
        import uuid
        
        property_dict.update({
            "id": str(uuid.uuid4()),
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "tenant_id": None
        })
        
        result = await db.properties.insert_one(property_dict)
        created_property = await db.properties.find_one({"_id": result.inserted_id})
        
        property_response = convert_objectid_to_str(created_property)
        logger.info("Property created", property_id=property_response["id"], user=current_user.email)
        return Property(**property_response)
        
    except Exception as e:
        logger.error("Error creating property", error=str(e), user=current_user.email)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{property_id}", response_model=Property)
async def update_property(
    property_id: str,
    property_updates: PropertyUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update existing property"""
    try:
        # Check if property exists
        existing_property = await db.properties.find_one({"id": property_id})
        if not existing_property:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Prepare update data
        update_data = {k: v for k, v in property_updates.dict().items() if v is not None}
        if update_data:
            from datetime import datetime
            update_data["updated_at"] = datetime.now()
            
            await db.properties.update_one(
                {"id": property_id},
                {"$set": update_data}
            )
        
        updated_property = await db.properties.find_one({"id": property_id})
        property_response = convert_objectid_to_str(updated_property)
        
        logger.info("Property updated", property_id=property_id, user=current_user.email)
        return Property(**property_response)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating property", property_id=property_id, error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{property_id}", response_model=MessageResponse)
async def delete_property(
    property_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete property and related data"""
    try:
        # Check if property exists
        existing_property = await db.properties.find_one({"id": property_id})
        if not existing_property:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Delete related data
        await db.transactions.delete_many({"property_id": property_id})
        await db.alerts.delete_many({"property_id": property_id})
        await db.documents.delete_many({"property_id": property_id})
        await db.energy_bills.delete_many({"property_id": property_id})
        await db.water_bills.delete_many({"property_id": property_id})
        
        # Delete property
        await db.properties.delete_one({"id": property_id})
        
        logger.info("Property deleted", property_id=property_id, user=current_user.email)
        return {"message": "Property deleted successfully", "status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error deleting property", property_id=property_id, error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")