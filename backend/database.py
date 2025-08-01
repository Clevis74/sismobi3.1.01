"""
Database connection and configuration for SISMOBI 3.2.0
"""
import motor.motor_asyncio
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
import structlog
from .config import settings

logger = structlog.get_logger(__name__)

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None

# Global database instance
db = Database()

async def connect_to_mongo():
    """Create database connection"""
    try:
        logger.info("Connecting to MongoDB", url=settings.mongo_url)
        db.client = AsyncIOMotorClient(
            settings.mongo_url,
            maxPoolSize=settings.max_connections_count,
            minPoolSize=settings.min_connections_count,
        )
        db.database = db.client[settings.database_name]
        
        # Test connection
        await db.client.admin.command('ismaster')
        logger.info("Successfully connected to MongoDB")
        
    except Exception as e:
        logger.error("Failed to connect to MongoDB", error=str(e))
        raise

async def close_mongo_connection():
    """Close database connection"""
    try:
        if db.client:
            db.client.close()
            logger.info("MongoDB connection closed")
    except Exception as e:
        logger.error("Error closing MongoDB connection", error=str(e))

def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    if db.database is None:
        raise Exception("Database not connected")
    return db.database