"""
Custom exceptions for the RentVerse AI Service.
"""


class RentVerseException(Exception):
    """Base exception for RentVerse AI Service."""
    
    def __init__(self, message: str, code: int = 500):
        self.message = message
        self.code = code
        super().__init__(self.message)


class ModelNotFoundError(RentVerseException):
    """Raised when a model file cannot be found or loaded."""

    def __init__(self, message: str):
        super().__init__(message, code=503)


class PredictionError(RentVerseException):
    """Raised when prediction fails."""
    
    def __init__(self, message: str):
        super().__init__(message, code=500)


class ValidationError(RentVerseException):
    """Raised when input validation fails."""
    
    def __init__(self, message: str):
        super().__init__(message, code=400)


class ModelLoadError(RentVerseException):
    """Raised when model loading fails."""

    def __init__(self, message: str):
        super().__init__(message, code=503)
