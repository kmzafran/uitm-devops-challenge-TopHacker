"""
Configuration management for RentVerse AI Service.
"""

import os
from typing import Optional, List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings."""
    
    # App configuration
    app_name: str = "RentVerse AI Service"
    app_version: str = "0.1.0"
    debug: bool = False

    # Server configuration
    host: str = "0.0.0.0"
    port: int = 8000

    # Model configuration
    model_dir: str = "rentverse/models"
    price_model_filename: str = "price_prediction_model.pkl"
    preprocessor_filename: str = "data_preprocessor.pkl"

    # API configuration
    api_prefix: str = "/api/v1"
    max_batch_size: int = 100
    
    # Logging configuration
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    cors_origins: List[str] = ["*"]
    cors_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    cors_headers: List[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get the application settings instance."""
    return settings
