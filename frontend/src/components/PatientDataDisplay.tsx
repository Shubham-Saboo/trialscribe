import React from 'react';
import './PatientDataDisplay.css';
import { PatientData } from '../types';

interface PatientDataDisplayProps {
  patientData: PatientData;
}

const PatientDataDisplay: React.FC<PatientDataDisplayProps> = ({ patientData }) => {
  return (
    <div className="patient-data-container">
      <h2>Extracted Patient Information</h2>
      <div className="patient-data-grid">
        <div className="data-item">
          <span className="data-label">Diagnosis:</span>
          <span className="data-value">{patientData.diagnosis || 'Not specified'}</span>
        </div>
        
        {patientData.age && (
          <div className="data-item">
            <span className="data-label">Age:</span>
            <span className="data-value">{patientData.age} years</span>
          </div>
        )}
        
        {patientData.gender && (
          <div className="data-item">
            <span className="data-label">Gender:</span>
            <span className="data-value">{patientData.gender}</span>
          </div>
        )}
        
        {patientData.symptoms.length > 0 && (
          <div className="data-item full-width">
            <span className="data-label">Symptoms:</span>
            <div className="data-value-list">
              {patientData.symptoms.map((symptom, idx) => (
                <span key={idx} className="badge">{symptom}</span>
              ))}
            </div>
          </div>
        )}
        
        {patientData.medical_history.length > 0 && (
          <div className="data-item full-width">
            <span className="data-label">Medical History:</span>
            <div className="data-value-list">
              {patientData.medical_history.map((item, idx) => (
                <span key={idx} className="badge secondary">{item}</span>
              ))}
            </div>
          </div>
        )}
        
        {patientData.current_medications.length > 0 && (
          <div className="data-item full-width">
            <span className="data-label">Current Medications:</span>
            <div className="data-value-list">
              {patientData.current_medications.map((med, idx) => (
                <span key={idx} className="badge info">{med}</span>
              ))}
            </div>
          </div>
        )}
        
        {patientData.treatment_plan && (
          <div className="data-item full-width">
            <span className="data-label">Treatment Plan:</span>
            <span className="data-value">{patientData.treatment_plan}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDataDisplay;

