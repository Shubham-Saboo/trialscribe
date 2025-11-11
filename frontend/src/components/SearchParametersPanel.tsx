import React, { useState, useEffect, useMemo, useRef } from 'react';
import './SearchParametersPanel.css';
import { PatientData } from '../types';

interface SearchParametersPanelProps {
  patientData: PatientData;
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

const SearchParametersPanel: React.FC<SearchParametersPanelProps> = ({
  patientData,
  onRefineSearch,
  loading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editedData, setEditedData] = useState<PatientData>(patientData);

  // Update edited data when patientData changes (only when diagnosis changes, indicating new search)
  const prevDiagnosisRef = useRef<string | null>(null);
  
  useEffect(() => {
    const isNewSearch = prevDiagnosisRef.current === null || 
                       prevDiagnosisRef.current !== patientData.diagnosis;
    
    if (isNewSearch) {
      setEditedData(patientData);
      prevDiagnosisRef.current = patientData.diagnosis;
    }
  }, [patientData]);

  const handleLocationChange = (field: keyof PatientData, value: string) => {
    setEditedData({
      ...editedData,
      [field]: value.trim() || null,
    });
  };

  const handleInterventionChange = (value: string) => {
    setEditedData({
      ...editedData,
      intervention: value.trim() || null,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRefineSearch(editedData);
  };

  const handleReset = () => {
    setEditedData(patientData);
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
      !compare(editedData.intervention, patientData.intervention) ||
      !compare(editedData.location_city, patientData.location_city) ||
      !compare(editedData.location_state, patientData.location_state) ||
      !compare(editedData.location_country, patientData.location_country) ||
      !compare(editedData.location_zip, patientData.location_zip) ||
      !compare(editedData.status_preference, patientData.status_preference) ||
      !compare(editedData.phase_preference, patientData.phase_preference)
    );
  }, [editedData, patientData]);

  return (
    <div className="search-parameters-panel">
      <div className="panel-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>
          <span className="panel-icon">{isExpanded ? '▼' : '▶'}</span>
          Search Parameters
        </h3>
        {hasChanges && <span className="unsaved-indicator">Unsaved changes</span>}
      </div>

      {isExpanded && (
        <form className="parameters-form" onSubmit={handleSubmit}>
          <div className="parameters-grid">
            {/* Diagnosis - Read Only */}
            <div className="parameter-group">
              <label className="parameter-label read-only">
                Condition/Diagnosis
                <span className="info-icon" title="Extracted from transcript and cannot be changed">
                  ℹ️
                </span>
              </label>
              <input
                type="text"
                value={editedData.diagnosis || ''}
                readOnly
                className="parameter-input read-only"
                placeholder="No diagnosis specified"
              />
            </div>

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

            {/* Phase Preference - Editable */}
            <div className="parameter-group full-width">
              <label className="parameter-label">Trial Phase (Optional)</label>
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
              disabled={!hasChanges || loading}
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

