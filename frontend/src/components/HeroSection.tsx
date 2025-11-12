import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaChevronDown } from 'react-icons/fa';
import './HeroSection.css';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="hero-section">
      <div className="hero-content">
        <div className="hero-badge">
          <FaRobot className="badge-icon" />
          <span>AI-Powered Clinical Trial Matching</span>
        </div>
        <h1 className="hero-title">
          Find Clinical Trials in <span className="gradient-text">Seconds</span>, Not Hours
        </h1>
        <p className="hero-description">
          The future of clinical trial discovery. Simply upload a doctor-patient conversation, 
          and our AI instantly extracts patient data and matches them with relevant clinical trials. 
          No more manual searches. No more outdated databases.
        </p>
        <div className="hero-cta">
          <button 
            className="cta-primary"
            onClick={() => navigate('/app')}
          >
            Try It Free
            <FaChevronDown className="cta-icon" />
          </button>
          <a 
            href="#how-it-works" 
            className="cta-secondary"
            onClick={(e) => {
              e.preventDefault();
              const element = document.querySelector('.how-it-works');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Learn More
          </a>
        </div>
        <div className="hero-trust">
          <p className="trust-text">Trusted by healthcare professionals nationwide</p>
          <div className="trust-badges">
            <span className="trust-badge">FDA Data Source</span>
            <span className="trust-badge">AI-Powered</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
