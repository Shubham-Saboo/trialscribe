import React from 'react';
import { FaStethoscope, FaSearch, FaClipboardList } from 'react-icons/fa';
import './HeroSection.css';

const HeroSection: React.FC = () => {
  return (
    <div className="hero-section">
      <div className="hero-content">
        <div className="hero-icon">
          <FaStethoscope />
        </div>
        <h2>Welcome to TrialScribe</h2>
        <p className="hero-description">
          Find relevant clinical trials from patient-doctor conversations using AI-powered extraction
        </p>
        <div className="hero-features">
          <div className="hero-feature">
            <FaClipboardList className="feature-icon" />
            <span>Extract Patient Data</span>
          </div>
          <div className="hero-feature">
            <FaSearch className="feature-icon" />
            <span>Match Clinical Trials</span>
          </div>
          <div className="hero-feature">
            <FaStethoscope className="feature-icon" />
            <span>Get Detailed Results</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;

