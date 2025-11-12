import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FaFilter, FaExclamationCircle } from 'react-icons/fa';
import './SearchParametersPanel.css';
import { PatientData } from '../types';

interface SearchParametersPanelProps {
  patientData: PatientData;
  originalPatientData: PatientData;
  onRefineSearch: (updatedData: PatientData) => void;
  loading?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'RECRUITING,NOT_YET_RECRUITING', label: 'Recruiting & Not Yet Recruiting' },
  { value: 'RECRUITING', label: 'Recruiting Only' },
  { value: 'NOT_YET_RECRUITING', label: 'Not Yet Recruiting Only' },
  { value: 'ACTIVE_NOT_RECRUITING', label: 'Active Not Recruiting' },
];

const PHASE_OPTIONS = [
  'Phase 1',
  'Phase 2',
  'Phase 3',
  'Phase 4',
  'Early Phase 1',
];

const GENDER_OPTIONS = [
  { value: null, label: 'All Genders' },
  { value: 'Male', label: 'Male Only' },
  { value: 'Female', label: 'Female Only' },
];

const SearchParametersPanel: React.FC<SearchParametersPanelProps> = ({
  patientData,
  originalPatientData,
  onRefineSearch,
  loading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editedData, setEditedData] = useState<PatientData>({
    ...patientData,
    additional_conditions: patientData.additional_conditions || [],
    additional_interventions: patientData.additional_interventions || [],
  });
  const [customSearchTerm, setCustomSearchTerm] = useState<string>('');

  // Update edited data when patientData changes (only when diagnosis changes, indicating new search)
  const prevDiagnosisRef = useRef<string | null>(null);
  
  useEffect(() => {
    const isNewSearch = prevDiagnosisRef.current === null || 
                       prevDiagnosisRef.current !== patientData.diagnosis;
    
    if (isNewSearch) {
      // Ensure arrays are initialized
      const normalizedData = {
        ...patientData,
        additional_conditions: patientData.additional_conditions || [],
        additional_interventions: patientData.additional_interventions || [],
      };
      setEditedData(normalizedData);
      setCustomSearchTerm(patientData.custom_search_term || '');
      prevDiagnosisRef.current = patientData.diagnosis;
    }
  }, [patientData]);

  const handleLocationChange = (field: keyof PatientData, value: string) => {
    setEditedData({
      ...editedData,
      [field]: value.trim() || null,
    });
  };

  const handleDiagnosisChange = (value: string) => {
    setEditedData({
      ...editedData,
      diagnosis: value.trim() || null,
    });
  };

  const handleInterventionChange = (value: string) => {
    setEditedData({
      ...editedData,
      intervention: value.trim() || null,
    });
  };

  const handleAdditionalConditionsChange = (value: string) => {
    // Parse comma-separated values
    const conditions = value
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);
    setEditedData({
      ...editedData,
      additional_conditions: conditions,
    });
  };

  const handleAdditionalInterventionsChange = (value: string) => {
    // Parse comma-separated values
    const interventions = value
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0);
    setEditedData({
      ...editedData,
      additional_interventions: interventions,
    });
  };

  const handleStatusChange = (value: string) => {
    setEditedData({
      ...editedData,
      status_preference: value || null,
    });
  };

  const handlePhaseChange = (phase: string, checked: boolean) => {
    const currentPhases = editedData.phase_preference || [];
    let updatedPhases: string[] | null;

    if (checked) {
      updatedPhases = [...currentPhases, phase];
    } else {
      updatedPhases = currentPhases.filter((p) => p !== phase);
      if (updatedPhases.length === 0) {
        updatedPhases = null;
      }
    }

    setEditedData({
      ...editedData,
      phase_preference: updatedPhases,
    });
  };

  const handleGenderChange = (value: string) => {
    setEditedData({
      ...editedData,
      gender: value || null,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Include custom search term in the refined search
    const refinedData = {
      ...editedData,
      custom_search_term: customSearchTerm.trim() || null,
    };
    onRefineSearch(refinedData);
  };

  const handleReset = () => {
    const normalizedOriginal = {
      ...originalPatientData,
      additional_conditions: originalPatientData.additional_conditions || [],
      additional_interventions: originalPatientData.additional_interventions || [],
    };
    setEditedData(normalizedOriginal);
    setCustomSearchTerm(originalPatientData.custom_search_term || '');
    // Trigger API call with original parameters
    onRefineSearch(originalPatientData);
  };

  // Check if any editable field has changed
  const hasChanges = useMemo(() => {
    const normalize = (val: any): string | null => {
      if (val === null || val === undefined || val === '') return null;
      if (Array.isArray(val)) {
        return val.length === 0 ? null : [...val].sort().join(',');
      }
      return String(val).trim() || null;
    };

    const compare = (a: any, b: any) => normalize(a) === normalize(b);

    return (
      !compare(editedData.diagnosis, originalPatientData.diagnosis) ||
      !compare(editedData.additional_conditions, originalPatientData.additional_conditions) ||
      !compare(editedData.intervention, originalPatientData.intervention) ||
      !compare(editedData.additional_interventions, originalPatientData.additional_interventions) ||
      !compare(editedData.location_city, originalPatientData.location_city) ||
      !compare(editedData.location_state, originalPatientData.location_state) ||
      !compare(editedData.location_country, originalPatientData.location_country) ||
      !compare(editedData.location_zip, originalPatientData.location_zip) ||
      !compare(editedData.status_preference, originalPatientData.status_preference) ||
      !compare(editedData.phase_preference, originalPatientData.phase_preference) ||
      !compare(editedData.gender, originalPatientData.gender) ||
      !compare(customSearchTerm.trim() || null, originalPatientData.custom_search_term)
    );
  }, [editedData, originalPatientData, customSearchTerm]);

  return (
    <div className="search-parameters-panel">
      <div className="panel-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>
          <span className="panel-icon">{isExpanded ? '▼' : '▶'}</span>
          <FaFilter />
          Search Parameters
        </h3>
        {hasChanges && (
          <span className="unsaved-indicator">
            <FaExclamationCircle />
            Unsaved changes
          </span>
        )}
      </div>

      {isExpanded && (
        <form className="parameters-form" onSubmit={handleSubmit}>
          <div className="parameters-grid">
            {/* Diagnosis - Editable */}
            <div className="parameter-group">
              <label className="parameter-label">
                Condition/Diagnosis
              </label>
              <input
                type="text"
                value={editedData.diagnosis || ''}
                onChange={(e) => handleDiagnosisChange(e.target.value)}
                className="parameter-input"
                placeholder="e.g., glioblastoma, lung cancer"
              />
            </div>

            {/* Additional Conditions - Editable (only show if not empty) */}
            {(editedData.additional_conditions && editedData.additional_conditions.length > 0) || 
             (originalPatientData.additional_conditions && originalPatientData.additional_conditions.length > 0) ? (
              <div className="parameter-group">
                <label className="parameter-label">
                  Additional Conditions
                </label>
                <input
                  type="text"
                  value={editedData.additional_conditions?.join(', ') || ''}
                  onChange={(e) => handleAdditionalConditionsChange(e.target.value)}
                  className="parameter-input"
                  placeholder="e.g., metastatic cancer, brain tumor"
                />
                <p className="parameter-hint">
                  Comma-separated list of additional conditions
                </p>
              </div>
            ) : null}

            {/* Intervention - Editable */}
            <div className="parameter-group">
              <label className="parameter-label">Intervention/Treatment</label>
              <input
                type="text"
                value={editedData.intervention || ''}
                onChange={(e) => handleInterventionChange(e.target.value)}
                className="parameter-input"
                placeholder="e.g., temozolomide, immunotherapy"
              />
            </div>

            {/* Additional Interventions - Editable (only show if not empty) */}
            {(editedData.additional_interventions && editedData.additional_interventions.length > 0) || 
             (originalPatientData.additional_interventions && originalPatientData.additional_interventions.length > 0) ? (
              <div className="parameter-group">
                <label className="parameter-label">
                  Additional Interventions
                </label>
                <input
                  type="text"
                  value={editedData.additional_interventions?.join(', ') || ''}
                  onChange={(e) => handleAdditionalInterventionsChange(e.target.value)}
                  className="parameter-input"
                  placeholder="e.g., radiation therapy, chemotherapy"
                />
                <p className="parameter-hint">
                  Comma-separated list of additional treatments
                </p>
              </div>
            ) : null}

            {/* Location Fields */}
            <div className="parameter-group full-width">
              <label className="parameter-label">Location</label>
              <div className="location-fields">
                <input
                  type="text"
                  value={editedData.location_city || ''}
                  onChange={(e) => handleLocationChange('location_city', e.target.value)}
                  className="parameter-input"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={editedData.location_state || ''}
                  onChange={(e) => handleLocationChange('location_state', e.target.value)}
                  className="parameter-input"
                  placeholder="State/Province"
                />
                <input
                  type="text"
                  value={editedData.location_country || ''}
                  onChange={(e) => handleLocationChange('location_country', e.target.value)}
                  className="parameter-input"
                  placeholder="Country"
                />
                <input
                  type="text"
                  value={editedData.location_zip || ''}
                  onChange={(e) => handleLocationChange('location_zip', e.target.value)}
                  className="parameter-input"
                  placeholder="ZIP/Postal Code"
                />
              </div>
              <p className="parameter-hint">
                Only the most specific location will be used (ZIP → City → State → Country)
              </p>
            </div>

            {/* Status Preference - Editable */}
            <div className="parameter-group">
              <label className="parameter-label">Trial Status</label>
              <select
                value={editedData.status_preference || 'RECRUITING,NOT_YET_RECRUITING'}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="parameter-select"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender Preference - Editable */}
            <div className="parameter-group">
              <label className="parameter-label">Gender</label>
              <select
                value={editedData.gender || ''}
                onChange={(e) => handleGenderChange(e.target.value)}
                className="parameter-select"
              >
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value || ''}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="parameter-hint">
                Filter trials by gender eligibility requirements
              </p>
            </div>

            {/* Phase Preference - Editable */}
            <div className="parameter-group full-width">
              <label className="parameter-label">Trial Phase</label>
              <div className="phase-checkboxes">
                {PHASE_OPTIONS.map((phase) => (
                  <label key={phase} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={(editedData.phase_preference || []).includes(phase)}
                      onChange={(e) => handlePhaseChange(phase, e.target.checked)}
                    />
                    <span>{phase}</span>
                  </label>
                ))}
              </div>
              {editedData.phase_preference && editedData.phase_preference.length > 0 && (
                <p className="parameter-hint">
                  Selected: {editedData.phase_preference.join(', ')}
                </p>
              )}
            </div>

            {/* Custom Search Term - Essie Expression Syntax */}
            <div className="parameter-group full-width">
              <label className="parameter-label">
                Custom Search (Essie Expression Syntax)
                <span className="info-icon" title="Use Essie expression syntax to combine keywords with AND/OR operators. Example: (biomarker AND targeted) OR precision">
                  ℹ️
                </span>
              </label>
              {customSearchTerm.trim() && (
                <div className="custom-search-warning">
                  <FaExclamationCircle />
                  <span>
                    <strong>Note:</strong> When using custom search, the Condition/Diagnosis and Intervention/Treatment fields above will be ignored. 
                    Only your custom search expression will be used.
                  </span>
                </div>
              )}
              <textarea
                value={customSearchTerm}
                onChange={(e) => setCustomSearchTerm(e.target.value)}
                className="parameter-input custom-search-input"
                placeholder="e.g., (biomarker AND targeted) OR precision, biomarker AND (targeted OR immunotherapy)"
                rows={3}
              />
              <p className="parameter-hint">
                Use Essie expression syntax to combine keywords. Supports AND, OR, parentheses, and quoted phrases. 
                <a 
                  href="https://clinicaltrials.gov/find-studies/constructing-complex-search-queries" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ marginLeft: '4px', color: 'var(--color-primary)', textDecoration: 'underline' }}
                >
                  Learn more
                </a>
              </p>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasChanges || loading}
              className="reset-button"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Searching...' : 'Refine Search'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SearchParametersPanel;

