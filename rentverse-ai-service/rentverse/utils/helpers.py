"""
Utility functions for RentVerse AI Service.
"""

import os
import json
from typing import Any, Dict, Optional
from datetime import datetime


def ensure_directory_exists(directory_path: str) -> None:
    """Ensure a directory exists, create if it doesn't."""
    os.makedirs(directory_path, exist_ok=True)


def load_json_file(file_path: str) -> Optional[Dict[str, Any]]:
    """Load JSON data from file safely."""
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None
    except (json.JSONDecodeError, IOError) as e:
        print(f"Error loading JSON file {file_path}: {str(e)}")
        return None


def save_json_file(data: Dict[str, Any], file_path: str) -> bool:
    """Save data to JSON file safely."""
    try:
        ensure_directory_exists(os.path.dirname(file_path))
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except IOError as e:
        print(f"Error saving JSON file {file_path}: {str(e)}")
        return False


def format_currency(amount: float, currency: str = "RM") -> str:
    """Format currency amount for display."""
    return f"{currency} {amount:,.2f}"


def get_current_timestamp() -> str:
    """Get current timestamp in ISO format."""
    return datetime.now().isoformat()


def validate_file_exists(file_path: str, description: str = "File") -> bool:
    """Validate that a file exists."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"{description} not found: {file_path}")
    return True
