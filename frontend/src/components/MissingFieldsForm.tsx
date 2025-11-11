import React, { useState } from 'react';
import './MissingFieldsForm.css';
import { PatientData, ValidationResult, ValidationField } from '../types';

interface MissingFieldsFormProps {
  patientData: PatientData;
  validation: ValidationResult;
  onSubmit: (updatedData: PatientData) => void;
  loading: boolean;
}

const MissingFieldsForm: React.FC<MissingFieldsFormProps> = ({
  patientData,
  validation,
  onSubmit,
  loading
}) => {
  const [formData, setFormData] = useState<Partial<PatientData>>({
    diagnosis: patientData.diagnosis || '',
    age: patientData.age || null,
    gender: patientData.gender || '',
    location_city: patientData.location_city || '',
    location_state: patientData.location_state || '',
    location_country: patientData.location_country || '',
    location_zip: patientData.location_zip || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Merge form data with existing patient data
    const updatedData: PatientData = {
      ...patientData,
      ...formData,
      age: formData.age || null,
      gender: formData.gender || null,
      symptoms: patientData.symptoms,
      medical_history: patientData.medical_history,
      current_medications: patientData.current_medications,
      treatment_plan: patientData.treatment_plan,
      exclusion_criteria: patientData.exclusion_criteria
    };
    
    onSubmit(updatedData);
  };

  const handleFieldChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const allFieldsToShow = [
    ...validation.missing_fields,
    ...validation.warnings
  ];

  return (
    <div className="missing-fields-form">
      <h2>Additional Information Needed</h2>
      <p className="form-description">
        To find the best clinical trials for you, we need some additional information:
      </p>

      <form onSubmit={handleSubmit}>
        {validation.missing_fields.length > 0 && (
          <div className="fields-section critical">
            <h3>Required Fields</h3>
            {validation.missing_fields.map((field: ValidationField, idx: number) => (
              <div key={idx} className="form-field">
                <label>
                  {field.label} <span className="required">*</span>
                </label>
                {field.field === 'diagnosis' ? (
                  <input
                    type="text"
                    value={formData.diagnosis || ''}
                    onChange={(e) => handleFieldChange('diagnosis', e.target.value)}
                    placeholder="e.g., Brain tumor, Diabetes, etc."
                    required
                  />
                ) : null}
              </div>
            ))}
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div className="fields-section important">
            <h3>Important Fields (Recommended)</h3>
            
            {validation.warnings.map((field: ValidationField, idx: number) => (
              <div key={idx} className="form-field">
                <label>{field.label}</label>
                
                {field.field === 'age' ? (
                  <input
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => handleFieldChange('age', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="e.g., 45"
                    min="0"
                    max="120"
                  />
                ) : field.field === 'gender' ? (
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => handleFieldChange('gender', e.target.value || null)}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : field.field === 'location' ? (
                  <div className="location-fields">
                    <input
                      type="text"
                      value={formData.location_city || ''}
                      onChange={(e) => handleFieldChange('location_city', e.target.value)}
                      placeholder="City (e.g., San Francisco)"
                    />
                    <input
                      type="text"
                      value={formData.location_state || ''}
                      onChange={(e) => handleFieldChange('location_state', e.target.value)}
                      placeholder="State (e.g., CA or California)"
                    />
                    <input
                      type="text"
                      value={formData.location_country || ''}
                      onChange={(e) => handleFieldChange('location_country', e.target.value)}
                      placeholder="Country (e.g., United States)"
                    />
                    <input
                      type="text"
                      value={formData.location_zip || ''}
                      onChange={(e) => handleFieldChange('location_zip', e.target.value)}
                      placeholder="Zip Code (e.g., 94102)"
                    />
                  </div>
                ) : null}
                
                <p className="field-help">{field.message}</p>
              </div>
            ))}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Updating...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MissingFieldsForm;

