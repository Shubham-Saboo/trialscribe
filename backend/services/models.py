"""
Pydantic models for TrialScribe application
Mapped to ClinicalTrials.gov API v2 query parameters
Reference: https://clinicaltrials.gov/data-api/api
"""
from typing import Optional, List
from pydantic import BaseModel, Field


class PatientData(BaseModel):
    """
    Structured patient data extracted from transcript.
    Fields are mapped to ClinicalTrials.gov API v2 query parameters.
    All fields default to None/null if not mentioned in the transcript.
    """
    # query.cond - Condition/Disease
    diagnosis: Optional[str] = Field(
        default=None,
        description="Primary diagnosis or condition mentioned. Maps to query.cond parameter."
    )
    
    # query.intr - Intervention
    intervention: Optional[str] = Field(
        default=None,
        description="Intervention, treatment, or therapy mentioned. Maps to query.intr parameter. Return null if no intervention is mentioned."
    )
    
    # query.term - General search term
    search_term: Optional[str] = Field(
        default=None,
        description="General search term or keyword mentioned in the conversation. Maps to query.term parameter."
    )
    
    # query.locn - Location
    location_city: Optional[str] = Field(
        default=None,
        description="City where patient is located or prefers treatment. Maps to query.locn parameter."
    )
    location_state: Optional[str] = Field(
        default=None,
        description="State or province where patient is located or prefers treatment. Maps to query.locn parameter."
    )
    location_country: Optional[str] = Field(
        default=None,
        description="Country where patient is located or prefers treatment. Maps to query.locn parameter."
    )
    location_zip: Optional[str] = Field(
        default=None,
        description="ZIP/postal code where patient is located or prefers treatment. Maps to query.locn parameter."
    )
    
    # query.outc - Outcome
    outcome: Optional[str] = Field(
        default=None,
        description="Desired outcome or endpoint mentioned. Maps to query.outc parameter."
    )
    
    # query.spns - Sponsor
    sponsor: Optional[str] = Field(
        default=None,
        description="Sponsor organization mentioned. Maps to query.spns parameter."
    )
    
    # Patient demographics (used for filtering but not direct query params)
    age: Optional[int] = Field(
        default=None,
        description="Patient age if mentioned, otherwise None. Used for eligibility filtering."
    )
    gender: Optional[str] = Field(
        default=None,
        description="Patient gender if mentioned (Male/Female/Other), otherwise None. Used for eligibility filtering."
    )
    
    # Additional clinical information
    symptoms: List[str] = Field(
        default_factory=list,
        description="List of symptoms mentioned. Used to refine condition search."
    )
    medical_history: List[str] = Field(
        default_factory=list,
        description="Relevant medical history items. Used for eligibility assessment."
    )
    current_medications: List[str] = Field(
        default_factory=list,
        description="Current medications if mentioned. Used for eligibility assessment."
    )
    treatment_plan: Optional[str] = Field(
        default=None,
        description="Treatment plan or recommendations if mentioned."
    )
    exclusion_criteria: List[str] = Field(
        default_factory=list,
        description="Any conditions or factors that would exclude patient from trials."
    )
    
    # filter.phase - Phase preference
    phase_preference: Optional[List[str]] = Field(
        default=None,
        description="Preferred trial phases mentioned (e.g., ['Phase 1', 'Phase 2']). Maps to filter.phase parameter. Return null if no phase preference is mentioned."
    )
    
    # filter.overallStatus - Status preference
    status_preference: Optional[str] = Field(
        default=None,
        description="Preferred trial status mentioned (e.g., 'RECRUITING', 'ACTIVE_NOT_RECRUITING'). Maps to filter.overallStatus parameter. Return null if no status preference is mentioned."
    )


class ClinicalTrial(BaseModel):
    """Clinical trial information"""
    nct_id: str = Field(description="NCT ID (National Clinical Trial identifier)")
    title: str = Field(description="Brief title of the trial")
    official_title: Optional[str] = Field(default=None, description="Official title of the trial")
    status: str = Field(description="Overall status of the trial")
    phase: List[str] = Field(default_factory=list, description="Trial phases")
    conditions: List[str] = Field(default_factory=list, description="Conditions being studied")
    summary: Optional[str] = Field(default=None, description="Brief summary of the trial")
    eligibility_criteria: Optional[str] = Field(default=None, description="Eligibility criteria")
    locations: List[str] = Field(default_factory=list, description="Trial locations")
    url: str = Field(description="URL to the trial on ClinicalTrials.gov")


class ExtractAndMatchResponse(BaseModel):
    """Response model for extract-and-match endpoint"""
    patient_data: PatientData
    trials: List[ClinicalTrial]
    transcript_length: int

