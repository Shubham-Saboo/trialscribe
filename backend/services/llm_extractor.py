"""
LLM-based patient data extraction service using LangChain v1.0
Simple, reliable pipeline: Extract → Validate → Return Pydantic model
"""
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from services.models import PatientData
from services.llm_client import create_llm_client
from services.exceptions import PatientDataExtractionError
from services.logger import get_logger

logger = get_logger("llm_extractor")

# System prompt for patient data extraction
EXTRACTION_SYSTEM_PROMPT = """You are a medical information extraction assistant. 
Extract structured information from patient-doctor conversation transcripts.

CRITICAL RULES:
1. Extract ONLY information explicitly mentioned in the conversation
2. If a field is NOT mentioned, set it to null
3. Return valid JSON matching the PatientData schema

Fields to extract:
- diagnosis: Primary disease/condition name (e.g., "glioblastoma", "Type 2 Diabetes"). If multiple conditions mentioned, use the primary one here.
- additional_conditions: Array of additional conditions/diseases mentioned (e.g., ["metastatic cancer", "brain tumor"]). Empty array if none.
- intervention: Primary treatment/medication/therapy (e.g., "temozolomide", "immunotherapy"). If multiple mentioned, use the primary one here.
- additional_interventions: Array of additional interventions/treatments mentioned (e.g., ["radiation therapy", "chemotherapy"]). Empty array if none.
- keywords: Array of relevant medical keywords or search terms extracted from the conversation (e.g., ["biomarker", "targeted therapy", "precision medicine"]). These help refine search queries. Empty array if none.
- location_city, location_state, location_country, location_zip: Patient location
- age: Numeric age (integer or null)
- gender: "Male", "Female", "Other", or null
- symptoms: Array of symptom strings (empty array if none). These can be used to enhance condition searches.
- medical_history: Array of medical history items (empty array if none)
- current_medications: Array of medications (empty array if none)
- treatment_plan: Treatment plan string or null
- exclusion_criteria: Array of exclusion factors (empty array if none)
- outcome: Desired outcome string or null
- sponsor: Sponsor organization string or null
- phase_preference: Array of phase strings or null (e.g., ["Phase 1", "Phase 2"])
- status_preference: Status string or null (e.g., "RECRUITING")
- search_term: General search term string or null (legacy field, prefer using keywords array)

Return ONLY valid JSON, no markdown, no explanations."""


def extract_patient_data(transcript: str) -> PatientData:
    """
    Extract structured patient data from transcript using LangChain.
    
    Simple pipeline:
    1. LLM extracts data as JSON
    2. Parse JSON to dict
    3. Validate and convert to PatientData Pydantic model
    4. Return PatientData instance
    
    Args:
        transcript: Patient-doctor conversation transcript
        
    Returns:
        PatientData Pydantic model instance
        
    Raises:
        PatientDataExtractionError: If extraction fails
        ValueError: If transcript is empty
    """
    if not transcript or not transcript.strip():
        raise ValueError("Transcript cannot be empty")
    
    try:
        logger.debug(f"Starting patient data extraction from transcript ({len(transcript)} chars)")
        
        # Create LLM client
        llm = create_llm_client()
        
        # Create prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system", EXTRACTION_SYSTEM_PROMPT),
            ("user", "Extract patient information from this transcript and return as JSON:\n\n{transcript}")
        ])
        
        # Use JsonOutputParser for reliable JSON parsing
        json_parser = JsonOutputParser(pydantic_object=PatientData)
        
        # Create chain: prompt -> llm -> json_parser
        chain = prompt | llm | json_parser
        
        # Invoke chain - returns dict
        logger.debug("Invoking LLM chain")
        extracted_dict = chain.invoke({"transcript": transcript})
        
        logger.debug(f"Extracted dict with keys: {list(extracted_dict.keys()) if isinstance(extracted_dict, dict) else 'not a dict'}")
        
        # Validate and convert to PatientData
        if not isinstance(extracted_dict, dict):
            raise PatientDataExtractionError(f"Expected dict, got {type(extracted_dict)}")
        
        if not extracted_dict:
            raise PatientDataExtractionError("LLM returned empty extraction result")
        
        # Check if it's a schema (shouldn't happen with JsonOutputParser)
        if 'properties' in extracted_dict and 'type' in extracted_dict:
            raise PatientDataExtractionError("LLM returned JSON schema instead of patient data")
        
        # Convert to Pydantic model
        try:
            patient_data = PatientData.model_validate(extracted_dict)
        except Exception as e:
            logger.error(f"Validation error: {str(e)}")
            logger.error(f"Extracted dict: {extracted_dict}")
            raise PatientDataExtractionError(f"Failed to validate PatientData: {str(e)}")
        
        logger.info(
            f"Successfully extracted: diagnosis={patient_data.diagnosis}, "
            f"intervention={patient_data.intervention}, age={patient_data.age}, "
            f"gender={patient_data.gender}, location={patient_data.location_city or patient_data.location_state}"
        )
        
        return patient_data
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise
    except PatientDataExtractionError:
        raise
    except Exception as e:
        logger.error(f"Error extracting patient data: {str(e)}", exc_info=True)
        raise PatientDataExtractionError(f"Failed to extract patient data: {str(e)}") from e
