# Alerts API Router - SISMOBI Backend v3.2.0

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase

from database import get_database
from models import Alert, AlertCreate, AlertUpdate
from utils import convert_objectid_to_str
from auth import get_current_user

router = APIRouter(
    prefix="/alerts",
    tags=["alerts"],
    dependencies=[Depends(get_current_user)]  # Require authentication
)

@router.get("/", response_model=dict)
async def get_alerts(
    skip: int = Query(0, ge=0, description="Number of alerts to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum number of alerts to return"),
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    tenant_id: Optional[str] = Query(None, description="Filter by tenant ID"),
    type: Optional[str] = Query(None, description="Filter by alert type"),
    priority: Optional[str] = Query(None, description="Filter by priority (low/medium/high/critical)"),
    resolved: Optional[bool] = Query(None, description="Filter by resolved status"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get all alerts with optional filtering and pagination
    """
    try:
        # Build filter query
        filter_query = {}
        if property_id:
            filter_query["property_id"] = property_id
        if tenant_id:
            filter_query["tenant_id"] = tenant_id
        if type:
            filter_query["type"] = type
        if priority:
            filter_query["priority"] = priority
        if resolved is not None:
            filter_query["resolved"] = resolved

        # Get alerts with filters, sort by priority and creation date
        priority_order = {"critical": 1, "high": 2, "medium": 3, "low": 4}
        cursor = db.alerts.find(filter_query).skip(skip).limit(limit)
        
        alerts = []
        async for alert in cursor:
            clean_alert = convert_objectid_to_str(alert)
            # Add priority score for frontend sorting if needed
            clean_alert["priority_score"] = priority_order.get(clean_alert.get("priority", "medium"), 3)
            alerts.append(clean_alert)

        # Sort by resolved status (unresolved first), then priority, then date
        alerts.sort(key=lambda x: (
            x.get("resolved", False),  # Unresolved first
            x.get("priority_score", 3),  # Higher priority first
            -(x.get("created_at", datetime.now()).timestamp() if isinstance(x.get("created_at"), datetime) else 0)  # Newer first
        ))

        # Get total count for pagination
        total = await db.alerts.count_documents(filter_query)

        return {
            "items": alerts,
            "total": total,
            "skip": skip,
            "limit": limit,
            "has_more": skip + limit < total
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching alerts: {str(e)}"
        )

@router.post("/", response_model=dict, status_code=201)
async def create_alert(
    alert: AlertCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Create a new alert
    """
    try:
        # Convert alert to dict
        alert_dict = alert.dict()
        
        # Verify property exists if provided
        if alert_dict.get("property_id"):
            property_doc = await db.properties.find_one({"id": alert_dict["property_id"]})
            if not property_doc:
                raise HTTPException(status_code=400, detail="Property not found")

        # Verify tenant exists if provided
        if alert_dict.get("tenant_id"):
            tenant_doc = await db.tenants.find_one({"id": alert_dict["tenant_id"]})
            if not tenant_doc:
                raise HTTPException(status_code=400, detail="Tenant not found")

        # Validate priority
        valid_priorities = ["low", "medium", "high", "critical"]
        if alert_dict.get("priority") not in valid_priorities:
            alert_dict["priority"] = "medium"

        # Insert alert
        result = await db.alerts.insert_one(alert_dict)
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create alert")

        # Fetch and return the created alert
        created_alert = await db.alerts.find_one({"_id": result.inserted_id})
        return convert_objectid_to_str(created_alert)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating alert: {str(e)}"
        )

@router.get("/{alert_id}", response_model=dict)
async def get_alert(
    alert_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a specific alert by ID
    """
    try:
        alert = await db.alerts.find_one({"id": alert_id})
        
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")

        return convert_objectid_to_str(alert)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching alert: {str(e)}"
        )

@router.put("/{alert_id}", response_model=dict)
async def update_alert(
    alert_id: str,
    alert_update: AlertUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Update a specific alert
    """
    try:
        # Check if alert exists
        existing_alert = await db.alerts.find_one({"id": alert_id})
        if not existing_alert:
            raise HTTPException(status_code=404, detail="Alert not found")

        # Prepare update data (exclude None values)
        update_data = {k: v for k, v in alert_update.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided for update")

        # Verify property exists if being updated
        if "property_id" in update_data and update_data["property_id"]:
            property_doc = await db.properties.find_one({"id": update_data["property_id"]})
            if not property_doc:
                raise HTTPException(status_code=400, detail="Property not found")

        # Verify tenant exists if being updated
        if "tenant_id" in update_data and update_data["tenant_id"]:
            tenant_doc = await db.tenants.find_one({"id": update_data["tenant_id"]})
            if not tenant_doc:
                raise HTTPException(status_code=400, detail="Tenant not found")

        # Validate priority if being updated
        if "priority" in update_data:
            valid_priorities = ["low", "medium", "high", "critical"]
            if update_data["priority"] not in valid_priorities:
                update_data["priority"] = "medium"

        # Handle alert resolution
        if "resolved" in update_data and update_data["resolved"] and not existing_alert.get("resolved"):
            update_data["resolved_at"] = datetime.now()
        elif "resolved" in update_data and not update_data["resolved"]:
            update_data["resolved_at"] = None

        # Update alert
        result = await db.alerts.update_one(
            {"id": alert_id},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found")

        # Fetch and return updated alert
        updated_alert = await db.alerts.find_one({"id": alert_id})
        return convert_objectid_to_str(updated_alert)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating alert: {str(e)}"
        )

@router.delete("/{alert_id}", status_code=204)
async def delete_alert(
    alert_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Delete a specific alert
    """
    try:
        result = await db.alerts.delete_one({"id": alert_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found")

        return

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting alert: {str(e)}"
        )

@router.put("/{alert_id}/resolve", response_model=dict)
async def resolve_alert(
    alert_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Mark an alert as resolved (convenience endpoint)
    """
    try:
        # Check if alert exists
        existing_alert = await db.alerts.find_one({"id": alert_id})
        if not existing_alert:
            raise HTTPException(status_code=404, detail="Alert not found")

        # Update alert to resolved
        update_data = {
            "resolved": True,
            "resolved_at": datetime.now()
        }

        result = await db.alerts.update_one(
            {"id": alert_id},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found")

        # Fetch and return updated alert
        updated_alert = await db.alerts.find_one({"id": alert_id})
        return convert_objectid_to_str(updated_alert)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error resolving alert: {str(e)}"
        )