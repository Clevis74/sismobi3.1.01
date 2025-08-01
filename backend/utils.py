"""
Utility functions for SISMOBI 3.2.0
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import structlog
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

logger = structlog.get_logger(__name__)

def convert_objectid_to_str(document: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB ObjectId to string for JSON serialization"""
    if document is None:
        return None
    
    if "_id" in document:
        # Only set id from _id if id field doesn't already exist
        if "id" not in document:
            document["id"] = str(document["_id"])
        del document["_id"]
    
    return document

def serialize_datetime(obj):
    """JSON serializer for datetime objects"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError("Type not serializable")

async def get_paginated_results(
    collection,
    filter_dict: Dict[str, Any] = None,
    page: int = 1,
    page_size: int = 50,
    sort_field: str = "created_at",
    sort_direction: int = -1
) -> Dict[str, Any]:
    """Get paginated results from MongoDB collection"""
    if filter_dict is None:
        filter_dict = {}
    
    # Calculate skip value
    skip = (page - 1) * page_size
    
    # Get total count
    total_count = await collection.count_documents(filter_dict)
    
    # Get paginated results
    cursor = collection.find(filter_dict).sort(sort_field, sort_direction).skip(skip).limit(page_size)
    items = []
    
    async for document in cursor:
        items.append(convert_objectid_to_str(document))
    
    # Calculate pagination info
    total_pages = (total_count + page_size - 1) // page_size
    has_next = page < total_pages
    has_prev = page > 1
    
    return {
        "items": items,
        "pagination": {
            "current_page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev
        }
    }

async def validate_property_exists(db: AsyncIOMotorDatabase, property_id: str) -> bool:
    """Validate if property exists"""
    try:
        property_doc = await db.properties.find_one({"id": property_id})
        return property_doc is not None
    except Exception as e:
        logger.error("Error validating property", property_id=property_id, error=str(e))
        return False

async def validate_tenant_exists(db: AsyncIOMotorDatabase, tenant_id: str) -> bool:
    """Validate if tenant exists"""
    try:
        tenant_doc = await db.tenants.find_one({"id": tenant_id})
        return tenant_doc is not None
    except Exception as e:
        logger.error("Error validating tenant", tenant_id=tenant_id, error=str(e))
        return False

async def calculate_dashboard_summary(db: AsyncIOMotorDatabase) -> Dict[str, Any]:
    """Calculate dashboard summary statistics"""
    try:
        # Get counts
        total_properties = await db.properties.count_documents({})
        total_tenants = await db.tenants.count_documents({"status": "active"})
        occupied_properties = await db.properties.count_documents({"status": "rented"})
        vacant_properties = await db.properties.count_documents({"status": "vacant"})
        
        # Calculate monthly income/expenses
        current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = current_month + timedelta(days=32)
        next_month = next_month.replace(day=1)
        
        # Get transactions for current month
        monthly_income_pipeline = [
            {
                "$match": {
                    "type": "income",
                    "date": {"$gte": current_month, "$lt": next_month}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": "$amount"}
                }
            }
        ]
        
        monthly_expense_pipeline = [
            {
                "$match": {
                    "type": "expense",
                    "date": {"$gte": current_month, "$lt": next_month}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": "$amount"}
                }
            }
        ]
        
        income_result = await db.transactions.aggregate(monthly_income_pipeline).to_list(1)
        expense_result = await db.transactions.aggregate(monthly_expense_pipeline).to_list(1)
        
        total_monthly_income = income_result[0]["total"] if income_result else 0
        total_monthly_expenses = expense_result[0]["total"] if expense_result else 0
        
        # Get pending alerts
        pending_alerts = await db.alerts.count_documents({"resolved": False})
        
        # Get recent transactions (last 5)
        recent_transactions_cursor = db.transactions.find({}).sort("created_at", -1).limit(5)
        recent_transactions = []
        async for transaction in recent_transactions_cursor:
            recent_transactions.append(convert_objectid_to_str(transaction))
        
        return {
            "total_properties": total_properties,
            "total_tenants": total_tenants,
            "occupied_properties": occupied_properties,
            "vacant_properties": vacant_properties,
            "total_monthly_income": total_monthly_income,
            "total_monthly_expenses": total_monthly_expenses,
            "pending_alerts": pending_alerts,
            "recent_transactions": recent_transactions
        }
        
    except Exception as e:
        logger.error("Error calculating dashboard summary", error=str(e))
        raise

def create_property_filter(
    status: Optional[str] = None,
    min_rent: Optional[float] = None,
    max_rent: Optional[float] = None,
    property_type: Optional[str] = None
) -> Dict[str, Any]:
    """Create property filter for database queries"""
    filter_dict = {}
    
    if status:
        filter_dict["status"] = status
    if min_rent is not None:
        filter_dict.setdefault("rent_value", {})["$gte"] = min_rent
    if max_rent is not None:
        filter_dict.setdefault("rent_value", {})["$lte"] = max_rent
    if property_type:
        filter_dict["type"] = {"$regex": property_type, "$options": "i"}
    
    return filter_dict

def create_transaction_filter(
    property_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    transaction_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    category: Optional[str] = None
) -> Dict[str, Any]:
    """Create transaction filter for database queries"""
    filter_dict = {}
    
    if property_id:
        filter_dict["property_id"] = property_id
    if tenant_id:
        filter_dict["tenant_id"] = tenant_id
    if transaction_type:
        filter_dict["type"] = transaction_type
    if start_date and end_date:
        filter_dict["date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        filter_dict["date"] = {"$gte": start_date}
    elif end_date:
        filter_dict["date"] = {"$lte": end_date}
    if category:
        filter_dict["category"] = {"$regex": category, "$options": "i"}
    
    return filter_dict

async def generate_automatic_alerts(db: AsyncIOMotorDatabase) -> List[Dict[str, Any]]:
    """Generate automatic alerts based on system data"""
    alerts = []
    current_date = datetime.now()
    
    try:
        # Rent due alerts
        day_of_month = current_date.day
        
        # Find tenants with rent due today or overdue
        tenants_cursor = db.tenants.find({
            "status": "active",
            "$or": [
                {"rent_due_date": day_of_month},  # Due today
                {"rent_due_date": {"$lt": day_of_month}}  # Overdue
            ]
        })
        
        async for tenant in tenants_cursor:
            # Check if payment was made this month
            month_start = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            payment_exists = await db.transactions.find_one({
                "tenant_id": tenant["id"],
                "type": "income",
                "category": {"$regex": "rent", "$options": "i"},
                "date": {"$gte": month_start}
            })
            
            if not payment_exists:
                is_overdue = tenant["rent_due_date"] < day_of_month
                alerts.append({
                    "property_id": tenant.get("property_id"),
                    "tenant_id": tenant["id"],
                    "title": f"{'Overdue' if is_overdue else 'Due'} Rent Payment",
                    "message": f"Rent payment is {'overdue' if is_overdue else 'due'} for tenant {tenant['name']}",
                    "type": "payment_overdue" if is_overdue else "rent_due",
                    "priority": "high" if is_overdue else "medium",
                    "due_date": current_date,
                    "created_at": current_date,
                    "updated_at": current_date
                })
        
        # Contract expiring alerts (next 30 days)
        # This would require contract end dates in tenant model - placeholder for now
        
        logger.info(f"Generated {len(alerts)} automatic alerts")
        return alerts
        
    except Exception as e:
        logger.error("Error generating automatic alerts", error=str(e))
        return []