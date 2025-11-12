import React from 'react';
import { FaUser, FaBirthdayCake, FaVenusMars, FaExclamationTriangle, FaHistory, FaPills, FaNotesMedical, FaFlask, FaGlobe } from 'react-icons/fa';
import './PatientDataDisplay.css';
import { PatientData } from '../types';

interface PatientDataDisplayProps {
  patientData: PatientData;
}

const PatientDataDisplay: React.FC<PatientDataDisplayProps> = ({ patientData }) => {
  // Format location - show most specific location available
  const formatLocation = () => {
    if (patientData.location_zip) {
      return `${patientData.location_zip}`;
    }
    if (patientData.location_city) {
      let location = patientData.location_city;
      if (patientData.location_state) {
        location += `, ${patientData.location_state}`;
      }
      if (patientData.location_country) {
        location += `, ${patientData.location_country}`;
      }
      return location;
    }
    if (patientData.location_state) {
      let location = patientData.location_state;
      if (patientData.location_country) {
        location += `, ${patientData.location_country}`;
      }
      return location;
    }
    if (patientData.location_country) {
      return patientData.location_country;
    }
    return null;
  };

  const location = formatLocation();

  return (
    <div className="patient-data-container">
      <h2>
        <FaUser />
        Extracted Patient Information
      </h2>
      <div className="patient-data-grid">
        <div className="data-item">
          <span className="data-label">Diagnosis:</span>
          <span className="data-value">{patientData.diagnosis || 'Not specified'}</span>
        </div>
        
        {patientData.intervention && (
          <div className="data-item">
            <span className="data-label">
              <FaFlask />
              Intervention/Treatment:
            </span>
            <span className="data-value">{patientData.intervention}</span>
          </div>
        )}
        
        {location && (
          <div className="data-item">
            <span className="data-label">
              <FaGlobe />
              Location:
            </span>
            <span className="data-value">{location}</span>
          </div>
        )}
        
        {patientData.age && (
          <div className="data-item">
            <span className="data-label">
              <FaBirthdayCake />
              Age:
            </span>
            <span className="data-value">{patientData.age} years</span>
          </div>
        )}
        
        {patientData.gender && (
          <div className="data-item">
            <span className="data-label">
              <FaVenusMars />
              Gender:
            </span>
            <span className="data-value">{patientData.gender}</span>
          </div>
        )}
        
        {patientData.symptoms.length > 0 && (
          <div className="data-item full-width">
            <span className="data-label">
              <FaExclamationTriangle />
              Symptoms:
            </span>
            <div className="data-value-list">
              {patientData.symptoms.map((symptom, idx) => (
                <span key={idx} className="badge">{symptom}</span>
              ))}
            </div>
          </div>
        )}
        
        {patientData.medical_history.length > 0 && (
          <div className="data-item full-width">
            <span className="data-label">
              <FaHistory />
              Medical History:
            </span>
            <div className="data-value-list">
              {patientData.medical_history.map((item, idx) => (
                <span key={idx} className="badge secondary">{item}</span>
              ))}
            </div>
          </div>
        )}
        
        {patientData.current_medications.length > 0 && (
          <div className="data-item full-width">
            <span className="data-label">
              <FaPills />
              Current Medications:
            </span>
            <div className="data-value-list">
              {patientData.current_medications.map((med, idx) => (
                <span key={idx} className="badge info">{med}</span>
              ))}
            </div>
          </div>
        )}
        
        {patientData.treatment_plan && (
          <div className="data-item full-width">
            <span className="data-label">
              <FaNotesMedical />
              Treatment Plan:
            </span>
            <span className="data-value">{patientData.treatment_plan}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDataDisplay;

