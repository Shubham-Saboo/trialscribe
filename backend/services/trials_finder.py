"""
ClinicalTrials.gov API integration service using Pydantic models
"""
import requests
import urllib.parse
from typing import Dict, List
from services.models import PatientData, ClinicalTrial
from config import Config
from services.exceptions import ClinicalTrialsAPIError
from services.logger import get_logger

logger = get_logger("trials_finder")

# Constants
MAX_LOCATIONS = Config.MAX_LOCATIONS_PER_TRIAL

def build_query_params(
    patient_data: PatientData,
    include_intervention: bool = False,
    include_additional_filters: bool = False
) -> Dict[str, str]:
    """
    Build query parameters for ClinicalTrials.gov API based on patient data.
    Maps PatientData fields to API query parameters as per:
    https://clinicaltrials.gov/data-api/api
    
    Args:
        patient_data: PatientData model instance
        include_intervention: Whether to include intervention parameter
        include_additional_filters: Whether to include additional filters (phase, outcome, etc.)
        
    Returns:
        Dictionary of query parameters
    """
    params: Dict[str, str] = {
        "format": "json",
        "pageSize": 50,  # Request 50 to check if we need to narrow down
    }
    
    # filter.overallStatus - Always include status filter
    # Default: Show RECRUITING and NOT_YET_RECRUITING (yet to recruit) studies
    if patient_data.status_preference:
        params["filter.overallStatus"] = patient_data.status_preference.upper()
    else:
        params["filter.overallStatus"] = "RECRUITING,NOT_YET_RECRUITING"
    
    # query.cond - Condition/Disease (Strategy 1: Always include if available)
    # Use ONLY the diagnosis, no symptoms or extra terms
    if patient_data.diagnosis:
        # Clean diagnosis - take first part if comma-separated, remove extra words
        diagnosis_clean = patient_data.diagnosis.split(",")[0].strip()
        # Remove phrases like "clinical trials for" or "research studies on"
        diagnosis_clean = _clean_diagnosis(diagnosis_clean)
        if diagnosis_clean:
            params["query.cond"] = diagnosis_clean
    
    # query.intr - Intervention (Strategy 2: Add if include_intervention is True)
    if include_intervention and patient_data.intervention:
        intervention_clean = _clean_intervention(patient_data.intervention)
        if intervention_clean:
            params["query.intr"] = intervention_clean
    
    # query.locn - Location (Always include if present)
    # Use only the most specific location (zip > city > state > country)
    location_parts = _build_location_query(patient_data)
    if location_parts:
        # Since we return only one location component, just use the first one
        params["query.locn"] = location_parts[0]
    
    # Additional filters (Strategy 3: Only if include_additional_filters is True)
    if include_additional_filters:
        # filter.phase - Phase preference
        if patient_data.phase_preference:
            phase_str = ",".join(patient_data.phase_preference)
            params["filter.phase"] = phase_str
        
        # query.outc - Outcome (only if it's a valid medical outcome)
        if patient_data.outcome:
            outcome_clean = _clean_outcome(patient_data.outcome)
            if outcome_clean:
                params["query.outc"] = outcome_clean
        
        # query.spns - Sponsor
        if patient_data.sponsor:
            params["query.spns"] = patient_data.sponsor
    
    return params


def _clean_diagnosis(diagnosis: str) -> str:
    """
    Clean diagnosis string - remove irrelevant phrases
    
    Args:
        diagnosis: Raw diagnosis string
        
    Returns:
        Cleaned diagnosis string
    """
    # Remove common irrelevant phrases
    irrelevant_phrases = [
        "clinical trials for",
        "research studies on",
        "trials for",
        "studies on",
        "treatment for",
    ]
    
    diagnosis_lower = diagnosis.lower()
    for phrase in irrelevant_phrases:
        if phrase in diagnosis_lower:
            diagnosis = diagnosis.replace(phrase, "").replace("for", "").replace("on", "").strip()
    
    # Remove extra whitespace
    diagnosis = " ".join(diagnosis.split())
    
    return diagnosis


def _clean_intervention(intervention: str) -> str:
    """
    Clean intervention string - extract the actual intervention name
    
    Args:
        intervention: Raw intervention string
        
    Returns:
        Cleaned intervention string
    """
    # Remove common prefixes
    prefixes = [
        "chemotherapy with",
        "treatment with",
        "therapy with",
        "using",
    ]
    
    intervention_lower = intervention.lower()
    for prefix in prefixes:
        if intervention_lower.startswith(prefix):
            intervention = intervention[len(prefix):].strip()
    
    # Take first part if comma-separated
    intervention = intervention.split(",")[0].strip()
    
    return intervention


def _clean_outcome(outcome: str) -> str:
    """
    Clean outcome string - only return if it's a valid medical outcome
    
    Args:
        outcome: Raw outcome string
        
    Returns:
        Cleaned outcome string or empty string if not valid
    """
    # Remove personal/emotional outcomes that aren't medical endpoints
    invalid_patterns = [
        "to be there for",
        "for my children",
        "for my family",
        "quality of life",
        "feel better",
    ]
    
    outcome_lower = outcome.lower()
    for pattern in invalid_patterns:
        if pattern in outcome_lower:
            return ""  # Not a valid medical outcome
    
    # Clean the outcome
    outcome = outcome.strip()
    
    return outcome


def _build_location_query(patient_data: PatientData) -> List[str]:
    """
    Build location query from patient data.
    
    The query.locn parameter searches across multiple fields, but being too specific
    (e.g., "San Francisco, California, USA") can return no results. We use only the
    most specific available location component with priority:
    1. Zip code (most specific)
    2. City
    3. State
    4. Country (least specific)
    
    Args:
        patient_data: PatientData model instance
        
    Returns:
        List with single location component (most specific available)
    """
    # Priority order: zip > city > state > country
    # Use only the most specific available location
    
    if patient_data.location_zip:
        return [patient_data.location_zip]
    
    if patient_data.location_city:
        return [patient_data.location_city]
    
    if patient_data.location_state:
        return [patient_data.location_state]
    
    if patient_data.location_country:
        return [patient_data.location_country]
    
    return []

def find_clinical_trials(patient_data: PatientData) -> List[ClinicalTrial]:
    """
    Find matching clinical trials using ClinicalTrials.gov API
    
    Uses a progressive filtering strategy:
    1. Strategy 1: status filter + condition filter (if diagnosis available)
    2. Strategy 2: Add intervention filter if results > 50
    3. Strategy 3: Add additional filters (phase, outcome, sponsor) if still > 50
    
    Args:
        patient_data: PatientData model instance
        
    Returns:
        List of ClinicalTrial model instances
        
    Raises:
        ClinicalTrialsAPIError: If API request fails
    """
    logger.info(
        f"Searching for clinical trials: "
        f"diagnosis={patient_data.diagnosis}, "
        f"intervention={patient_data.intervention}, "
        f"location={patient_data.location_city or patient_data.location_state}"
    )
    
    trials: List[ClinicalTrial] = []
    
    try:
        # Strategy 1: status filter + condition filter + location (if available)
        params = build_query_params(
            patient_data,
            include_intervention=False,
            include_additional_filters=False
        )
        trials = _fetch_trials_from_api(params)
        
        logger.info(f"Strategy 1: Found {len(trials)} trials (status + condition + location)")
        
        # Strategy 2: If results > 50, add intervention filter to narrow down
        if len(trials) > 50 and patient_data.intervention:
            logger.info(f"Strategy 1 returned {len(trials)} trials (>50), adding intervention filter")
            params = build_query_params(
                patient_data,
                include_intervention=True,
                include_additional_filters=False
            )
            trials = _fetch_trials_from_api(params)
            logger.info(f"Strategy 2: Found {len(trials)} trials (added intervention)")
        
        # Strategy 3: If still > 50, add additional filters (phase, outcome, sponsor)
        if len(trials) > 50:
            logger.info(f"Strategy 2 returned {len(trials)} trials (>50), adding additional filters")
            params = build_query_params(
                patient_data,
                include_intervention=True,
                include_additional_filters=True
            )
            trials = _fetch_trials_from_api(params)
            logger.info(f"Strategy 3: Found {len(trials)} trials (added additional filters)")
        
        logger.info(f"Returning {len(trials)} clinical trials")
        return trials
        
    except ClinicalTrialsAPIError:
        # Re-raise API errors
        raise
    except Exception as e:
        logger.error(f"Unexpected error finding clinical trials: {str(e)}", exc_info=True)
        raise ClinicalTrialsAPIError(f"Failed to find clinical trials: {str(e)}") from e


def _fetch_trials_from_api(params: Dict[str, str]) -> List[ClinicalTrial]:
    """
    Fetch trials from the ClinicalTrials.gov API
    
    Args:
        params: Query parameters for the API
        
    Returns:
        List of ClinicalTrial model instances
        
    Raises:
        ClinicalTrialsAPIError: If API request fails
    """
    try:
        # Build full URL for logging
        full_url = f"{Config.CLINICAL_TRIALS_API_BASE}?{urllib.parse.urlencode(params)}"
        
        # Log the complete API call with all parameters
        logger.info("=" * 80)
        logger.info("ClinicalTrials.gov API Request:")
        logger.info(f"URL: {Config.CLINICAL_TRIALS_API_BASE}")
        logger.info("Query Parameters:")
        for key, value in sorted(params.items()):
            logger.info(f"  {key}: {value}")
        logger.info(f"Full URL: {full_url}")
        logger.info("=" * 80)
        
        response = requests.get(
            Config.CLINICAL_TRIALS_API_BASE,
            params=params,
            timeout=Config.CLINICAL_TRIALS_TIMEOUT
        )
        response.raise_for_status()
        
        data = response.json()
        studies = data.get("studies", [])
        
        logger.debug(f"Received {len(studies)} studies from API")
        
        trials = []
        for study in studies:
            try:
                trial = _parse_study(study)
                if trial:
                    trials.append(trial)
            except Exception as e:
                logger.warning(f"Failed to parse study: {str(e)}")
                continue
        
        return trials
        
    except requests.exceptions.Timeout:
        logger.error("ClinicalTrials.gov API request timed out")
        raise ClinicalTrialsAPIError("Request to ClinicalTrials.gov API timed out")
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching clinical trials: {str(e)}")
        raise ClinicalTrialsAPIError(f"API request failed: {str(e)}") from e
    except Exception as e:
        logger.error(f"Error processing API response: {str(e)}", exc_info=True)
        raise ClinicalTrialsAPIError(f"Failed to process API response: {str(e)}") from e


def _parse_study(study: Dict) -> ClinicalTrial:
    """
    Parse a study from the API response into a ClinicalTrial model
    
    Args:
        study: Study data from API response
        
    Returns:
        ClinicalTrial model instance
    """
    protocol_section = study.get("protocolSection", {})
    identification_module = protocol_section.get("identificationModule", {})
    eligibility_module = protocol_section.get("eligibilityModule", {})
    status_module = protocol_section.get("statusModule", {})
    description_module = protocol_section.get("descriptionModule", {})
    
    nct_id = identification_module.get("nctId", "N/A")
    
    return ClinicalTrial(
        nct_id=nct_id,
        title=identification_module.get("briefTitle", "No title available"),
        official_title=identification_module.get("officialTitle"),
        status=status_module.get("overallStatus", "Unknown"),
        phase=status_module.get("phases", []),
        conditions=eligibility_module.get("conditions", []),
        summary=description_module.get("briefSummary"),
        eligibility_criteria=eligibility_module.get("eligibilityCriteria"),
        locations=_extract_locations(protocol_section.get("contactsLocationsModule", {})),
        url=f"https://clinicaltrials.gov/study/{nct_id}"
    )

def _extract_locations(contacts_locations_module: Dict) -> List[str]:
    """
    Extract location information from contacts/locations module
    
    Args:
        contacts_locations_module: Location data from API response
        
    Returns:
        List of formatted location strings
    """
    locations = []
    location_list = contacts_locations_module.get("locations", [])
    
    for location in location_list[:MAX_LOCATIONS]:
        location_name = location.get("facility", "")
        city = location.get("city", "")
        state = location.get("state", "")
        country = location.get("country", "")
        
        location_str = ", ".join(filter(None, [location_name, city, state, country]))
        if location_str:
            locations.append(location_str)
    
    return locations

