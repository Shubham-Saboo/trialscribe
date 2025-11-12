export interface PatientData {
  // Condition/Disease
  diagnosis: string | null;
  
  // Additional conditions/diagnoses
  additional_conditions: string[];
  
  // Intervention/Treatment
  intervention: string | null;
  
  // Additional interventions/treatments
  additional_interventions: string[];
  
  // Search term
  search_term: string | null;
  
  // Custom search term (Essie expression syntax for refine search)
  custom_search_term: string | null;
  
  // Location
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  location_zip: string | null;
  
  // Outcome
  outcome: string | null;
  
  // Sponsor
  sponsor: string | null;
  
  // Demographics
  age: number | null;
  gender: string | null;
  
  // Clinical information
  symptoms: string[];
  medical_history: string[];
  current_medications: string[];
  treatment_plan: string | null;
  exclusion_criteria: string[];
  
  // Trial preferences
  phase_preference: string[] | null;
  status_preference: string | null;
}

export interface ClinicalTrial {
  nct_id: string;
  title: string;
  official_title: string;
  status: string;
  phase: string[];
  conditions: string[];
  summary: string;
  eligibility_criteria: string;
  locations: string[];
  url: string;
  raw_data?: any; // Full raw API response data for comprehensive chatbot context
}


