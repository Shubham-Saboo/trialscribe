import React from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './ComparisonSection.css';

const ComparisonSection: React.FC = () => {
  const features = [
    {
      feature: 'Search Method',
      clinicaltrials: 'Manual keyword search',
      trialscribe: 'AI-powered conversation analysis'
    },
    {
      feature: 'Time to Results',
      clinicaltrials: 'Hours of manual searching',
      trialscribe: 'Seconds'
    },
    {
      feature: 'Data Entry',
      clinicaltrials: 'Manual entry required',
      trialscribe: 'Automatic extraction'
    },
    {
      feature: 'Matching Accuracy',
      clinicaltrials: 'Basic keyword matching',
      trialscribe: 'Intelligent patient-trial matching'
    },
    {
      feature: 'User Experience',
      clinicaltrials: 'Outdated interface',
      trialscribe: 'Modern, intuitive design'
    },
    {
      feature: 'Personalization',
      clinicaltrials: 'Generic search results',
      trialscribe: 'Tailored to patient profile'
    }
  ];

  return (
    <section className="comparison-section">
      <div className="comparison-container">
        <div className="section-header">
          <h2 className="section-title">TrialScribe vs. ClinicalTrials.gov</h2>
          <p className="section-subtitle">
            See why healthcare professionals are switching to TrialScribe
          </p>
        </div>
        <div className="comparison-table">
          <div className="comparison-header">
            <div className="comparison-cell feature-header">Feature</div>
            <div className="comparison-cell old-way">
              <div className="platform-name">ClinicalTrials.gov</div>
              <div className="platform-tag">Traditional</div>
            </div>
            <div className="comparison-cell new-way">
              <div className="platform-name">TrialScribe</div>
              <div className="platform-tag">AI-Powered</div>
            </div>
          </div>
          {features.map((item, index) => (
            <div key={index} className="comparison-row">
              <div className="comparison-cell feature-name">{item.feature}</div>
              <div className="comparison-cell old-value">
                <FaTimesCircle className="icon-times" />
                <span>{item.clinicaltrials}</span>
              </div>
              <div className="comparison-cell new-value">
                <FaCheckCircle className="icon-check" />
                <span>{item.trialscribe}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;

