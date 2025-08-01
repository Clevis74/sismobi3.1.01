"""
Configuration settings for SISMOBI Backend 3.2.0
"""
from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Database Configuration
    mongo_url: str = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    database_name: str = os.getenv("DATABASE_NAME", "sismobi")
    
    # Security & Authentication
    secret_key: str = os.getenv("SECRET_KEY", "sismobi_super_secret_key_change_in_production_2025")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # API Configuration
    api_version: str = os.getenv("API_VERSION", "v1")
    api_prefix: str = os.getenv("API_PREFIX", "/api/v1")
    
    # Development Settings
    debug: bool = os.getenv("DEBUG", "true").lower() == "true"
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    # CORS Configuration
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5174",
        "http://localhost:5173"
    ]
    
    # Performance Settings
    cache_expire_minutes: int = int(os.getenv("CACHE_EXPIRE_MINUTES", "10"))
    max_connections_count: int = int(os.getenv("MAX_CONNECTIONS_COUNT", "10"))
    min_connections_count: int = int(os.getenv("MIN_CONNECTIONS_COUNT", "1"))
    
    class Config:
        env_file = ".env"

# Global settings instance
settings = Settings()