"""
LangChain tools for clinical trial search
"""
from typing import List
from langchain_core.tools import tool
from services.models import PatientData
from services.trials_finder import find_clinical_trials
from services.logger import get_logger

logger = get_logger("trial_tools")


@tool
def search_clinical_trials_tool(patient_data: PatientData) -> List[dict]:
    """
    Search for clinical trials matching patient data.
    
    This tool can be used by LangChain agents to search for clinical trials
    based on patient information.
    
    Args:
        patient_data: PatientData model instance containing patient information
        
    Returns:
        List of clinical trial dictionaries matching the patient's condition
    """
    try:
        logger.info(f"Tool: Searching clinical trials for diagnosis={patient_data.diagnosis}")
        trials = find_clinical_trials(patient_data)
        # Convert Pydantic models to dictionaries for JSON serialization
        result = [trial.model_dump() for trial in trials]
        logger.info(f"Tool: Found {len(result)} trials")
        return result
    except Exception as e:
        logger.error(f"Tool error: {str(e)}")
        raise

