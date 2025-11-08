"""
ClinicalTrials.gov API integration service
"""
import requests
from typing import Dict, List

CLINICAL_TRIALS_API_BASE = "https://clinicaltrials.gov/api/v2/studies"

def build_query_params(patient_data: Dict) -> Dict[str, str]:
    """
    Build query parameters for ClinicalTrials.gov API based on patient data
    
    Args:
        patient_data: Extracted patient data dictionary
        
    Returns:
        Dictionary of query parameters
    """
    params = {
        "format": "json",
        "pageSize": 20,  # Request more results to ensure we get multiple matches
    }
    
    # Build query filter - use broader search terms
    query_parts = []
    
    # Add diagnosis/condition - use broader terms
    if patient_data.get("diagnosis") and patient_data["diagnosis"] != "Unknown":
        diagnosis = patient_data["diagnosis"]
        # Extract key terms from diagnosis (remove common words, keep medical terms)
        diagnosis_clean = diagnosis.split(",")[0].strip()
        # Add the full diagnosis and also try key terms
        query_parts.append(diagnosis_clean)
        
        # Extract key medical terms (words that are likely condition names)
        words = diagnosis_clean.split()
        # Filter out common words and keep medical terms (usually capitalized or specific terms)
        medical_terms = [w for w in words if len(w) > 3 and w.lower() not in ['the', 'and', 'or', 'for', 'with', 'from']]
        if medical_terms:
            # Add individual key terms for broader matching
            query_parts.extend(medical_terms[:3])  # Add up to 3 key terms
    
    # Add symptoms for broader matching
    if patient_data.get("symptoms"):
        # Add primary symptoms to broaden the search
        symptoms = patient_data["symptoms"][:3]  # Use first 3 symptoms
        query_parts.extend(symptoms)
    
    # Build the query - use OR to get more results
    if query_parts:
        # Use OR to broaden the search and get more matches
        params["query.cond"] = " OR ".join(query_parts[:5])  # Limit to 5 terms to avoid URL length issues
    
    # Filter for recruiting studies (but also include active-not-recruiting as fallback)
    # Note: We'll filter this in post-processing if needed
    params["filter.overallStatus"] = "RECRUITING"
    
    return params

def find_clinical_trials(patient_data: Dict) -> List[Dict]:
    """
    Find matching clinical trials using ClinicalTrials.gov API
    
    Args:
        patient_data: Extracted patient data dictionary
        
    Returns:
        List of clinical trial dictionaries
    """
    trials = []
    
    try:
        # Strategy 1: Try with RECRUITING status first
        params = build_query_params(patient_data)
        trials = _fetch_trials_from_api(params, max_results=10)
        
        # Strategy 2: If we don't have enough results, try without status filter
        if len(trials) < 5:
            params_no_filter = params.copy()
            params_no_filter.pop("filter.overallStatus", None)
            additional_trials = _fetch_trials_from_api(params_no_filter, max_results=10)
            
            # Add trials that aren't already in our list
            existing_ids = {t["nct_id"] for t in trials}
            for trial in additional_trials:
                if trial["nct_id"] not in existing_ids and len(trials) < 10:
                    trials.append(trial)
        
        # Strategy 3: If still not enough, try a broader search with just diagnosis/symptoms
        if len(trials) < 5 and patient_data.get("diagnosis") and patient_data["diagnosis"] != "Unknown":
            diagnosis = patient_data["diagnosis"].split(",")[0].strip()
            broader_params = {
                "format": "json",
                "pageSize": 15,
                "query.cond": diagnosis
            }
            additional_trials = _fetch_trials_from_api(broader_params, max_results=10)
            
            # Add trials that aren't already in our list
            existing_ids = {t["nct_id"] for t in trials}
            for trial in additional_trials:
                if trial["nct_id"] not in existing_ids and len(trials) < 10:
                    trials.append(trial)
        
        # Log for debugging
        print(f"Found {len(trials)} clinical trials")
        
        return trials[:10]  # Return up to 10 results
        
    except Exception as e:
        print(f"Error processing clinical trials: {str(e)}")
        return trials if trials else []

def _fetch_trials_from_api(params: Dict[str, str], max_results: int = 10) -> List[Dict]:
    """
    Helper function to fetch trials from the API
    
    Args:
        params: Query parameters for the API
        max_results: Maximum number of results to return
        
    Returns:
        List of clinical trial dictionaries
    """
    try:
        response = requests.get(CLINICAL_TRIALS_API_BASE, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        studies = data.get("studies", [])
        
        trials = []
        for study in studies[:max_results]:
            protocol_section = study.get("protocolSection", {})
            identification_module = protocol_section.get("identificationModule", {})
            eligibility_module = protocol_section.get("eligibilityModule", {})
            status_module = protocol_section.get("statusModule", {})
            description_module = protocol_section.get("descriptionModule", {})
            
            trial = {
                "nct_id": identification_module.get("nctId", "N/A"),
                "title": identification_module.get("briefTitle", "No title available"),
                "official_title": identification_module.get("officialTitle", ""),
                "status": status_module.get("overallStatus", "Unknown"),
                "phase": status_module.get("phases", []),
                "conditions": eligibility_module.get("conditions", []),
                "summary": description_module.get("briefSummary", ""),
                "eligibility_criteria": eligibility_module.get("eligibilityCriteria", ""),
                "locations": _extract_locations(protocol_section.get("contactsLocationsModule", {})),
                "url": f"https://clinicaltrials.gov/study/{identification_module.get('nctId', '')}"
            }
            
            trials.append(trial)
        
        return trials
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching clinical trials: {str(e)}")
        return []
    except Exception as e:
        print(f"Error processing API response: {str(e)}")
        return []

def _extract_locations(contacts_locations_module: Dict) -> List[str]:
    """Extract location information from contacts/locations module"""
    locations = []
    location_list = contacts_locations_module.get("locations", [])
    
    for location in location_list[:5]:  # Limit to 5 locations
        location_name = location.get("facility", "")
        city = location.get("city", "")
        state = location.get("state", "")
        country = location.get("country", "")
        
        location_str = ", ".join(filter(None, [location_name, city, state, country]))
        if location_str:
            locations.append(location_str)
    
    return locations

