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
        "sort": "@relevance",  # Sort results by relevance
    }
    
    # filter.overallStatus - Always include status filter
    # Default: Show RECRUITING and NOT_YET_RECRUITING (yet to recruit) studies
    if patient_data.status_preference:
        params["filter.overallStatus"] = patient_data.status_preference.upper()
    else:
        params["filter.overallStatus"] = "RECRUITING,NOT_YET_RECRUITING"
    
    # Check if custom_search_term is provided - if so, use ONLY query.term and exclude query.cond/query.intr
    if patient_data.custom_search_term and patient_data.custom_search_term.strip():
        # Custom search mode: Use ONLY query.term with Essie expression syntax
        # Do NOT include query.cond or query.intr when custom search is used
        params["query.term"] = patient_data.custom_search_term.strip()
        logger.debug(f"Custom search mode: Using ONLY query.term (Essie syntax): {patient_data.custom_search_term}")
        logger.debug("Excluding query.cond and query.intr parameters in custom search mode")
    else:
        # Standard search mode: Build condition and intervention queries
        # query.term is NOT set here - it will only be set via custom_search_term
        # query.cond - Condition/Disease (Strategy 1: Always include if available)
        # Build complex condition query using multiple conditions and symptoms
        condition_query = _build_condition_query(patient_data)
        if condition_query:
            params["query.cond"] = condition_query
        
        # query.intr - Intervention (Strategy 2: Add if include_intervention is True)
        # Build complex intervention query using multiple interventions
        if include_intervention:
            intervention_query = _build_intervention_query(patient_data)
            if intervention_query:
                params["query.intr"] = intervention_query
        
        # query.term is intentionally NOT set in standard mode
        # It will only be set when custom_search_term is explicitly provided by the user
    
    # query.locn - Location (Always include if present)
    # Use only the most specific location (zip > city > state > country)
    location = _get_most_specific_location(patient_data)
    if location:
        params["query.locn"] = location
    
    # filter.advanced - Phase, Gender, and Age preferences (Always include if set, regardless of strategy)
    # API format: filter.advanced=AREA[Phase](PHASE1 OR PHASE2)+AREA[Sex]FEMALE+AREA[MinimumAge]RANGE[MIN, 45 years] AND AREA[MaximumAge]RANGE[45 years, MAX]
    advanced_filters = []
    
    # Phase filter
    if patient_data.phase_preference:
        converted_phases = [_convert_phase_format(p) for p in patient_data.phase_preference]
        phases_str = " OR ".join(converted_phases)
        advanced_filters.append(f"AREA[Phase]({phases_str})")
    
    # Gender filter
    if patient_data.gender:
        gender_upper = patient_data.gender.upper().strip()
        # Map to API format: Male -> MALE, Female -> FEMALE, Other -> ALL
        if gender_upper in ["MALE", "FEMALE"]:
            advanced_filters.append(f"AREA[Sex]{gender_upper}")
        # Note: "Other" or "ALL" typically means no gender restriction, so we don't add a filter
    
    # Age filter
    if patient_data.age is not None:
        age_filter = _build_age_filter(patient_data.age)
        if age_filter:
            # Wrap age filter in parentheses when combining with other filters
            # This prevents the API from misinterpreting the internal " AND " operator
            if len(advanced_filters) > 0:
                advanced_filters.append(f"({age_filter})")
            else:
                advanced_filters.append(age_filter)
    
    if advanced_filters:
        params["filter.advanced"] = "+".join(advanced_filters)
    
    # Additional filters (Strategy 2: Only if include_additional_filters is True)
    if include_additional_filters:
        # query.outc - Outcome
        if patient_data.outcome:
            params["query.outc"] = patient_data.outcome.strip()
        
        # query.spns - Sponsor
        if patient_data.sponsor:
            params["query.spns"] = patient_data.sponsor
    
    return params


def _convert_phase_format(phase: str) -> str:
    """Convert phase format from 'Phase X' to 'PHASEX' for API"""
    phase_upper = phase.upper().strip()
    if phase_upper.startswith("PHASE"):
        number = phase_upper.replace("PHASE", "").replace(" ", "").strip()
        return f"PHASE{number}"
    if "EARLY" in phase_upper and "PHASE" in phase_upper:
        number = phase_upper.replace("EARLY", "").replace("PHASE", "").replace(" ", "").strip()
        return f"EARLY_PHASE{number}"
    return phase_upper.replace(" ", "_")


def _build_age_filter(patient_age: int) -> str:
    """
    Build age filter for ClinicalTrials.gov API using AREA[MinimumAge] and AREA[MaximumAge].
    
    Format: AREA[MinimumAge]RANGE[MIN, X years] AND AREA[MaximumAge]RANGE[X years, MAX]
    
    This ensures we find trials where:
    - MinimumAge <= patient_age (trial accepts patients at least as young as patient)
    - MaximumAge >= patient_age (trial accepts patients at least as old as patient)
    
    Args:
        patient_age: Patient's age in years
        
    Returns:
        Age filter string for filter.advanced parameter
    """
    # Format: AREA[MinimumAge]RANGE[MIN, X years] AND AREA[MaximumAge]RANGE[X years, MAX]
    return f"AREA[MinimumAge]RANGE[MIN, {patient_age} years] AND AREA[MaximumAge]RANGE[{patient_age} years, MAX]"


def _clean_intervention(intervention: str) -> str:
    """Clean intervention string - remove prefixes and take first part if comma-separated"""
    prefixes = ["chemotherapy with", "treatment with", "therapy with", "using"]
    intervention_lower = intervention.lower()
    for prefix in prefixes:
        if intervention_lower.startswith(prefix):
            intervention = intervention[len(prefix):].strip()
            break
    return intervention.split(",")[0].strip()


def _build_condition_query(patient_data: PatientData) -> str | None:
    """
    Build complex condition query using multiple conditions and symptoms.
    
    Combines:
    - Primary diagnosis
    - Additional conditions
    - Relevant symptoms (if they're medical conditions)
    
    Uses OR operator to find trials matching any of the conditions.
    Uses AND operator when combining with symptoms for more specific matches.
    
    Args:
        patient_data: PatientData model instance
        
    Returns:
        Condition query string or None
    """
    conditions = []
    
    # Add primary diagnosis
    if patient_data.diagnosis:
        diagnosis_clean = patient_data.diagnosis.split(",")[0].strip()
        if diagnosis_clean:
            conditions.append(diagnosis_clean)
    
    # Add additional conditions
    if patient_data.additional_conditions:
        for cond in patient_data.additional_conditions:
            cond_clean = cond.strip()
            if cond_clean and cond_clean not in conditions:
                conditions.append(cond_clean)
    
    # Add relevant symptoms that might be conditions (e.g., "diabetes", "hypertension")
    # Filter out generic symptoms like "pain", "fatigue"
    medical_condition_symptoms = [
        s.strip() for s in patient_data.symptoms 
        if s.strip() and len(s.strip()) > 3  # Filter very short terms
        and s.strip().lower() not in ["pain", "fatigue", "nausea", "vomiting", "fever", "headache"]
    ]
    
    # Limit to top 3 most relevant symptoms to avoid overly broad queries
    if medical_condition_symptoms:
        conditions.extend(medical_condition_symptoms[:3])
    
    if not conditions:
        return None
    
    # If single condition, return as-is
    if len(conditions) == 1:
        return conditions[0]
    
    # Multiple conditions: use OR operator
    # Format: "condition1 OR condition2 OR condition3"
    return " OR ".join(conditions)


def _build_intervention_query(patient_data: PatientData) -> str | None:
    """
    Build complex intervention query using multiple interventions.
    
    Combines primary intervention with additional interventions using OR operator.
    
    Args:
        patient_data: PatientData model instance
        
    Returns:
        Intervention query string or None
    """
    interventions = []
    
    # Add primary intervention
    if patient_data.intervention:
        intervention_clean = _clean_intervention(patient_data.intervention)
        if intervention_clean:
            interventions.append(intervention_clean)
    
    # Add additional interventions
    if patient_data.additional_interventions:
        for intr in patient_data.additional_interventions:
            intr_clean = _clean_intervention(intr)
            if intr_clean and intr_clean not in interventions:
                interventions.append(intr_clean)
    
    if not interventions:
        return None
    
    # If single intervention, return as-is
    if len(interventions) == 1:
        return interventions[0]
    
    # Multiple interventions: use OR operator
    # Format: "intervention1 OR intervention2"
    return " OR ".join(interventions)


def _build_keyword_query(patient_data: PatientData) -> str | None:
    """
    Build keyword query using extracted keywords.
    
    Uses AND operator to find trials matching all keywords (more specific).
    Falls back to OR if too many keywords (broader search).
    
    Args:
        patient_data: PatientData model instance
        
    Returns:
        Keyword query string or None
    """
    keywords = []
    
    # Use keywords array if available
    if patient_data.keywords:
        keywords.extend([k.strip() for k in patient_data.keywords if k.strip()])
    
    # Fallback to search_term if no keywords
    if not keywords and patient_data.search_term:
        keywords.append(patient_data.search_term.strip())
    
    # Also consider relevant medical terms from treatment plan
    if patient_data.treatment_plan and not keywords:
        # Extract key medical terms (simplified - could be enhanced with NLP)
        treatment_lower = patient_data.treatment_plan.lower()
        medical_terms = []
        for term in ["targeted", "precision", "biomarker", "genetic", "molecular", "immunotherapy"]:
            if term in treatment_lower:
                medical_terms.append(term)
        keywords.extend(medical_terms[:2])  # Limit to 2 terms
    
    if not keywords:
        return None
    
    # If single keyword, return as-is
    if len(keywords) == 1:
        return keywords[0]
    
    # Multiple keywords: use AND for specificity (2-3 keywords) or OR for broader search (4+)
    if len(keywords) <= 3:
        # AND operator: trials must match all keywords (more specific)
        return " AND ".join(keywords)
    else:
        # OR operator: trials matching any keyword (broader search)
        return " OR ".join(keywords[:5])  # Limit to 5 keywords


def _get_most_specific_location(patient_data: PatientData) -> str | None:
    """
    Get the most specific location from patient data.
    
    Priority: zip > city > state > country
    
    Args:
        patient_data: PatientData model instance
        
    Returns:
        Most specific location string or None
    """
    return (
        patient_data.location_zip or
        patient_data.location_city or
        patient_data.location_state or
        patient_data.location_country or
        None
    )

def find_clinical_trials(patient_data: PatientData) -> List[ClinicalTrial]:
    """
    Find matching clinical trials using ClinicalTrials.gov API
    
    Uses a progressive filtering strategy:
    1. Strategy 1: status filter + condition filter + location + intervention (if set) + phase (if set) + gender (if set)
    2. Strategy 2: Add additional filters (outcome, sponsor) if results > 50
    
    Args:
        patient_data: PatientData model instance
        
    Returns:
        List of ClinicalTrial model instances
        
    Raises:
        ClinicalTrialsAPIError: If API request fails
    """
    logger.debug(
        f"Searching for clinical trials: "
        f"diagnosis={patient_data.diagnosis}, "
        f"additional_conditions={patient_data.additional_conditions}, "
        f"intervention={patient_data.intervention}, "
        f"additional_interventions={patient_data.additional_interventions}, "
        f"keywords={patient_data.keywords}, "
        f"location={patient_data.location_city or patient_data.location_state}"
    )
    
    trials: List[ClinicalTrial] = []
    
    try:
        # Strategy 1: status filter + condition filter + location + intervention (if available)
        # Include intervention from the start if it's set (user preference)
        params = build_query_params(
            patient_data,
            include_intervention=bool(patient_data.intervention),  # Include if set
            include_additional_filters=False
        )
        trials = _fetch_trials_from_api(params)
        
        logger.debug(f"Strategy 1: Found {len(trials)} trials (status + condition + location + intervention)")
        
        # Strategy 2: If still > 50, add additional filters (outcome, sponsor)
        if len(trials) > 50:
            logger.debug(f"Strategy 1 returned {len(trials)} trials (>50), adding additional filters")
            params = build_query_params(
                patient_data,
                include_intervention=bool(patient_data.intervention),
                include_additional_filters=True
            )
            trials = _fetch_trials_from_api(params)
            logger.debug(f"Strategy 2: Found {len(trials)} trials (added additional filters)")
        
        logger.debug(f"Returning {len(trials)} clinical trials")
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
        # Log API call
        full_url = f"{Config.CLINICAL_TRIALS_API_BASE}?{urllib.parse.urlencode(params)}"
        logger.info(f"ClinicalTrials.gov API Request: {full_url}")
        logger.debug(f"Parameters: {dict(sorted(params.items()))}")
        
        response = requests.get(
            Config.CLINICAL_TRIALS_API_BASE,
            params=params,
            timeout=Config.CLINICAL_TRIALS_TIMEOUT
        )
        response.raise_for_status()
        
        data = response.json()
        studies = data.get("studies", [])
        
        logger.debug(f"Received {len(studies)} studies from API")
        
        trials = [t for t in (_parse_study(study) for study in studies) if t]
        
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


def _parse_study(study: Dict) -> ClinicalTrial | None:
    """Parse a study from the API response into a ClinicalTrial model"""
    try:
        protocol = study.get("protocolSection", {})
        ident = protocol.get("identificationModule", {})
        eligibility = protocol.get("eligibilityModule", {})
        status = protocol.get("statusModule", {})
        description = protocol.get("descriptionModule", {})
        design = protocol.get("designModule", {})
        conditions_module = protocol.get("conditionsModule", {})
        
        nct_id = ident.get("nctId", "N/A")
        
        return ClinicalTrial(
            nct_id=nct_id,
            title=ident.get("briefTitle", "No title available"),
            official_title=ident.get("officialTitle"),
            status=status.get("overallStatus", "Unknown"),
            phase=design.get("phases", []),  # Phases are in designModule, not statusModule
            conditions=conditions_module.get("conditions", []),  # Conditions are in conditionsModule, not eligibilityModule
            summary=description.get("briefSummary"),
            eligibility_criteria=eligibility.get("eligibilityCriteria"),
            locations=_extract_locations(protocol.get("contactsLocationsModule", {})),
            url=f"https://clinicaltrials.gov/study/{nct_id}",
            raw_data=study  # Store the full raw API response
        )
    except Exception as e:
        logger.warning(f"Failed to parse study: {str(e)}")
        return None

def _extract_locations(contacts_locations_module: Dict) -> List[str]:
    """Extract location information from contacts/locations module"""
    locations = []
    for location in contacts_locations_module.get("locations", [])[:MAX_LOCATIONS]:
        parts = [
            location.get("facility", ""),
            location.get("city", ""),
            location.get("state", ""),
            location.get("country", "")
        ]
        location_str = ", ".join(filter(None, parts))
        if location_str:
            locations.append(location_str)
    return locations

