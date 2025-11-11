"""
Configuration management for TrialScribe backend
"""
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """Application configuration"""
    
    # API Configuration
    PORT: int = int(os.getenv("PORT", "5001"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    OPENAI_TEMPERATURE: float = float(os.getenv("OPENAI_TEMPERATURE", "0"))
    
    # Clinical Trials API Configuration
    CLINICAL_TRIALS_API_BASE: str = "https://clinicaltrials.gov/api/v2/studies"
    CLINICAL_TRIALS_TIMEOUT: int = int(os.getenv("CLINICAL_TRIALS_TIMEOUT", "10"))
    CLINICAL_TRIALS_MAX_RESULTS: int = int(os.getenv("CLINICAL_TRIALS_MAX_RESULTS", "10"))
    CLINICAL_TRIALS_MIN_RESULTS: int = int(os.getenv("CLINICAL_TRIALS_MIN_RESULTS", "5"))
    
    # Search Configuration
    MAX_QUERY_TERMS: int = 5
    MAX_LOCATIONS_PER_TRIAL: int = 5
    
    @classmethod
    def validate(cls) -> None:
        """Validate required configuration"""
        if not cls.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY environment variable is required")

