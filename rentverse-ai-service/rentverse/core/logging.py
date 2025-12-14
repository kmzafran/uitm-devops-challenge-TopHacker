"""
Logging configuration for RentVerse AI Service.
"""

import logging
import sys
from typing import Optional
from pathlib import Path


def setup_logging(log_level: str = "INFO", log_file: Optional[str] = None) -> None:
    """Setup logging configuration."""

    # Create formatter
    formatter = logging.Formatter(
        fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Setup console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # Setup root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    root_logger.addHandler(console_handler)

    # Add file handler if log_file is specified
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

    # Reduce noise from external libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)


class StructuredLogger:
    """Structured logger for API requests and events."""

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)

    def log_api_request(self, method: str, path: str, **kwargs):
        """Log API request with structured data."""
        extra_data = " ".join([f"{k}={v}" for k, v in kwargs.items()])
        self.logger.info(f"API_REQUEST {method} {path} {extra_data}")

    def log_prediction(self, property_type: str, predicted_price: float, **kwargs):
        """Log prediction result."""
        extra_data = " ".join([f"{k}={v}" for k, v in kwargs.items()])
        self.logger.info(f"PREDICTION {property_type} price=${predicted_price:.2f} {extra_data}")

    def log_error(self, error_type: str, message: str, **kwargs):
        """Log error with context."""
        extra_data = " ".join([f"{k}={v}" for k, v in kwargs.items()])
        self.logger.error(f"ERROR {error_type} {message} {extra_data}")
