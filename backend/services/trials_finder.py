"""
ClinicalTrials.gov API integration service
"""
import requests
import urllib.parse
from typing import Dict, List
from services.models import PatientData, ClinicalTrial
from config import Config
from services.exceptions import ClinicalTrialsAPIError
from services.logger import get_logger

logger = get_logger("trials_finder")
MAX_LOCATIONS = Config.MAX_LOCATIONS_PER_TRIAL


def build_query_params(
    patient_data: PatientData,
    include_intervention: bool = False,
    include_additional_filters: bool = False
) -> Dict[str, str]:
    """Build query parameters for ClinicalTrials.gov API v2"""
    params: Dict[str, str] = {
        "format": "json",
        "pageSize": 50,
        "sort": "@relevance",
    }
    
    # Status filter
    params["filter.overallStatus"] = (
        patient_data.status_preference.upper() 
        if patient_data.status_preference 
        else "RECRUITING,NOT_YET_RECRUITING"
    )
    
    # Custom search mode: use only query.term, exclude condition/intervention
    if patient_data.custom_search_term and patient_data.custom_search_term.strip():
        params["query.term"] = patient_data.custom_search_term.strip()
    else:
        # Standard mode: use condition and intervention queries
        condition_query = _build_condition_query(patient_data)
        if condition_query:
            params["query.cond"] = condition_query
        
        if include_intervention:
            intervention_query = _build_intervention_query(patient_data)
            if intervention_query:
                params["query.intr"] = intervention_query
    
    # Location (most specific available)
    location = _get_most_specific_location(patient_data)
    if location:
        params["query.locn"] = location
    
    # Advanced filters: phase, gender, age
    advanced_filters = []
    
    if patient_data.phase_preference:
        phases = " OR ".join([_convert_phase_format(p) for p in patient_data.phase_preference])
        advanced_filters.append(f"AREA[Phase]({phases})")
    
    if patient_data.gender and patient_data.gender.upper() in ["MALE", "FEMALE"]:
        advanced_filters.append(f"AREA[Sex]{patient_data.gender.upper()}")
    
    if patient_data.age is not None:
        age_filter = _build_age_filter(patient_data.age)
        if age_filter:
            if len(advanced_filters) > 0:
                advanced_filters.append(f"({age_filter})")
            else:
                advanced_filters.append(age_filter)
    
    if advanced_filters:
        params["filter.advanced"] = " AND ".join(advanced_filters)
    
    # Optional filters: outcome, sponsor
    if include_additional_filters:
        if patient_data.outcome:
            params["query.outc"] = patient_data.outcome.strip()
        if patient_data.sponsor:
            params["query.spns"] = patient_data.sponsor
    
    return params


def _convert_phase_format(phase: str) -> str:
    """Convert 'Phase X' to 'PHASEX' format for API"""
    phase_upper = phase.upper().strip()
    if phase_upper.startswith("PHASE"):
        number = phase_upper.replace("PHASE", "").replace(" ", "").strip()
        return f"PHASE{number}"
    if "EARLY" in phase_upper and "PHASE" in phase_upper:
        number = phase_upper.replace("EARLY", "").replace("PHASE", "").replace(" ", "").strip()
        return f"EARLY_PHASE{number}"
    return phase_upper.replace(" ", "_")


def _build_age_filter(patient_age: int) -> str:
    """Build age filter: finds trials where patient_age is within trial's age range"""
    return f"AREA[MinimumAge]RANGE[MIN, {patient_age} years] AND AREA[MaximumAge]RANGE[{patient_age} years, MAX]"


def _clean_intervention(intervention: str) -> str:
    """Remove common prefixes and take first term if comma-separated"""
    prefixes = ["chemotherapy with", "treatment with", "therapy with", "using"]
    intervention_lower = intervention.lower()
    for prefix in prefixes:
        if intervention_lower.startswith(prefix):
            intervention = intervention[len(prefix):].strip()
            break
    return intervention.split(",")[0].strip()


def _build_condition_query(patient_data: PatientData) -> str | None:
    """Build condition query combining diagnosis, additional conditions, and relevant symptoms"""
    conditions = []
    
    if patient_data.diagnosis:
        conditions.append(patient_data.diagnosis.split(",")[0].strip())
    
    if patient_data.additional_conditions:
        for cond in patient_data.additional_conditions:
            cond_clean = cond.strip()
            if cond_clean and cond_clean not in conditions:
                conditions.append(cond_clean)
    
    # Add relevant symptoms (exclude generic ones like "pain", "fatigue")
    generic_symptoms = {"pain", "fatigue", "nausea", "vomiting", "fever", "headache"}
    medical_symptoms = [
        s.strip() for s in patient_data.symptoms 
        if s.strip() and len(s.strip()) > 3 and s.strip().lower() not in generic_symptoms
    ]
    conditions.extend(medical_symptoms[:3])
    
    if not conditions:
        return None
    
    return conditions[0] if len(conditions) == 1 else " OR ".join(conditions)


def _build_intervention_query(patient_data: PatientData) -> str | None:
    """Build intervention query combining primary and additional interventions"""
    interventions = []
    
    if patient_data.intervention:
        cleaned = _clean_intervention(patient_data.intervention)
        if cleaned:
            interventions.append(cleaned)
    
    if patient_data.additional_interventions:
        for intr in patient_data.additional_interventions:
            cleaned = _clean_intervention(intr)
            if cleaned and cleaned not in interventions:
                interventions.append(cleaned)
    
    if not interventions:
        return None
    
    return interventions[0] if len(interventions) == 1 else " OR ".join(interventions)


def _get_most_specific_location(patient_data: PatientData) -> str | None:
    """Get most specific location: zip > city > state > country"""
    return (
        patient_data.location_zip or
        patient_data.location_city or
        patient_data.location_state or
        patient_data.location_country or
        None
    )

def find_clinical_trials(patient_data: PatientData) -> List[ClinicalTrial]:
    """
    Find matching clinical trials using progressive filtering:
    1. Basic filters: status, condition, location, intervention, phase, gender, age
    2. If >50 results: add outcome and sponsor filters
    """
    try:
        params = build_query_params(
            patient_data,
            include_intervention=bool(patient_data.intervention),
            include_additional_filters=False
        )
        trials = _fetch_trials_from_api(params)
        
        if len(trials) > 50:
            params = build_query_params(
                patient_data,
                include_intervention=bool(patient_data.intervention),
                include_additional_filters=True
            )
            trials = _fetch_trials_from_api(params)
        
        return trials
        
    except ClinicalTrialsAPIError:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise ClinicalTrialsAPIError(f"Failed to find clinical trials: {str(e)}") from e


def _fetch_trials_from_api(params: Dict[str, str]) -> List[ClinicalTrial]:
    """Fetch and parse trials from ClinicalTrials.gov API"""
    try:
        full_url = f"{Config.CLINICAL_TRIALS_API_BASE}?{urllib.parse.urlencode(params)}"
        logger.info(f"ClinicalTrials.gov API Request: {full_url}")
        
        response = requests.get(
            Config.CLINICAL_TRIALS_API_BASE,
            params=params,
            timeout=Config.CLINICAL_TRIALS_TIMEOUT
        )
        response.raise_for_status()
        
        studies = response.json().get("studies", [])
        return [t for t in (_parse_study(study) for study in studies) if t]
        
    except requests.exceptions.Timeout:
        raise ClinicalTrialsAPIError("Request to ClinicalTrials.gov API timed out")
    except requests.exceptions.RequestException as e:
        raise ClinicalTrialsAPIError(f"API request failed: {str(e)}") from e
    except Exception as e:
        logger.error(f"Error processing API response: {str(e)}", exc_info=True)
        raise ClinicalTrialsAPIError(f"Failed to process API response: {str(e)}") from e


def _parse_study(study: Dict) -> ClinicalTrial | None:
    """Parse API study response into ClinicalTrial model"""
    try:
        protocol = study.get("protocolSection", {})
        ident = protocol.get("identificationModule", {})
        nct_id = ident.get("nctId", "N/A")
        
        return ClinicalTrial(
            nct_id=nct_id,
            title=ident.get("briefTitle", "No title available"),
            official_title=ident.get("officialTitle"),
            status=protocol.get("statusModule", {}).get("overallStatus", "Unknown"),
            phase=protocol.get("designModule", {}).get("phases", []),
            conditions=protocol.get("conditionsModule", {}).get("conditions", []),
            summary=protocol.get("descriptionModule", {}).get("briefSummary"),
            eligibility_criteria=protocol.get("eligibilityModule", {}).get("eligibilityCriteria"),
            locations=_extract_locations(protocol.get("contactsLocationsModule", {})),
            url=f"https://clinicaltrials.gov/study/{nct_id}",
            raw_data=study
        )
    except Exception as e:
        logger.warning(f"Failed to parse study: {str(e)}")
        return None


def _extract_locations(contacts_locations_module: Dict) -> List[str]:
    """Extract location strings from API response"""
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

