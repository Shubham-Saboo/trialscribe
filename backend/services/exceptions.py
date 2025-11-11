"""
Custom exceptions for TrialScribe services
"""


class TrialScribeException(Exception):
    """Base exception for TrialScribe application"""
    pass


class PatientDataExtractionError(TrialScribeException):
    """Raised when patient data extraction fails"""
    pass


class ClinicalTrialsAPIError(TrialScribeException):
    """Raised when ClinicalTrials.gov API request fails"""
    pass


class InvalidInputError(TrialScribeException):
    """Raised when input validation fails"""
    pass

