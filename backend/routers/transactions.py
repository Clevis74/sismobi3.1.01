# Transactions API Router - SISMOBI Backend v3.2.0

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..database import get_database
from ..models import Transaction, TransactionCreate, TransactionUpdate
from ..utils import convert_objectid_to_str
from ..auth import get_current_user

router = APIRouter(
    prefix="/transactions",
    tags=["transactions"],
    dependencies=[Depends(get_current_user)]  # Require authentication
)

@router.get("/", response_model=dict)
async def get_transactions(
    skip: int = Query(0, ge=0, description="Number of transactions to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum number of transactions to return"),
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    tenant_id: Optional[str] = Query(None, description="Filter by tenant ID"),
    type: Optional[str] = Query(None, description="Filter by transaction type (income/expense)"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get all transactions with optional filtering and pagination
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

        # Get transactions with filters
        cursor = db.transactions.find(filter_query).skip(skip).limit(limit).sort("date", -1)
        transactions = []
        
        async for transaction in cursor:
            clean_transaction = convert_objectid_to_str(transaction)
            transactions.append(clean_transaction)

        # Get total count for pagination
        total = await db.transactions.count_documents(filter_query)

        return {
            "items": transactions,
            "total": total,
            "skip": skip,
            "limit": limit,
            "has_more": skip + limit < total
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching transactions: {str(e)}"
        )

@router.post("/", response_model=dict, status_code=201)
async def create_transaction(
    transaction: TransactionCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Create a new transaction
    """
    try:
        # Convert transaction to dict and ensure property_id exists
        transaction_dict = transaction.dict()
        
        # Verify property exists
        if transaction_dict["property_id"]:
            property_doc = await db.properties.find_one({"id": transaction_dict["property_id"]})
            if not property_doc:
                raise HTTPException(status_code=400, detail="Property not found")

        # Verify tenant exists if provided
        if transaction_dict.get("tenant_id"):
            tenant_doc = await db.tenants.find_one({"id": transaction_dict["tenant_id"]})
            if not tenant_doc:
                raise HTTPException(status_code=400, detail="Tenant not found")

        # Insert transaction
        result = await db.transactions.insert_one(transaction_dict)
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create transaction")

        # Fetch and return the created transaction
        created_transaction = await db.transactions.find_one({"_id": result.inserted_id})
        return convert_objectid_to_str(created_transaction)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating transaction: {str(e)}"
        )

@router.get("/{transaction_id}", response_model=dict)
async def get_transaction(
    transaction_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a specific transaction by ID
    """
    try:
        transaction = await db.transactions.find_one({"id": transaction_id})
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")

        return convert_objectid_to_str(transaction)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching transaction: {str(e)}"
        )

@router.put("/{transaction_id}", response_model=dict)
async def update_transaction(
    transaction_id: str,
    transaction_update: TransactionUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Update a specific transaction
    """
    try:
        # Check if transaction exists
        existing_transaction = await db.transactions.find_one({"id": transaction_id})
        if not existing_transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")

        # Prepare update data (exclude None values)
        update_data = {k: v for k, v in transaction_update.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided for update")

        # Verify property exists if being updated
        if "property_id" in update_data:
            property_doc = await db.properties.find_one({"id": update_data["property_id"]})
            if not property_doc:
                raise HTTPException(status_code=400, detail="Property not found")

        # Verify tenant exists if being updated
        if "tenant_id" in update_data:
            tenant_doc = await db.tenants.find_one({"id": update_data["tenant_id"]})
            if not tenant_doc:
                raise HTTPException(status_code=400, detail="Tenant not found")

        # Update transaction
        result = await db.transactions.update_one(
            {"id": transaction_id},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")

        # Fetch and return updated transaction
        updated_transaction = await db.transactions.find_one({"id": transaction_id})
        return convert_objectid_to_str(updated_transaction)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating transaction: {str(e)}"
        )

@router.delete("/{transaction_id}", status_code=204)
async def delete_transaction(
    transaction_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Delete a specific transaction
    """
    try:
        result = await db.transactions.delete_one({"id": transaction_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")

        return

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting transaction: {str(e)}"
        )