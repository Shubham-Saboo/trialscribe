export interface PatientData {
  diagnosis: string;
  age: number | null;
  gender: string | null;
  symptoms: string[];
  medical_history: string[];
  current_medications: string[];
  treatment_plan: string | null;
  exclusion_criteria: string[];
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
}

