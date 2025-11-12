import React from 'react';
import { FaFileAlt, FaStar, FaSearch, FaCheckCircle } from 'react-icons/fa';
import './HowItWorks.css';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '01',
      icon: <FaFileAlt />,
      title: 'Upload Conversation',
      description: 'Simply paste or upload the doctor-patient conversation transcript. No manual data entry required.'
    },
    {
      number: '02',
      icon: <FaStar />,
      title: 'AI Extracts Data',
      description: 'Our advanced AI automatically extracts patient information: diagnosis, age, location, medications, and more.'
    },
    {
      number: '03',
      icon: <FaSearch />,
      title: 'Match Clinical Trials',
      description: 'Instantly match with relevant clinical trials from ClinicalTrials.gov based on patient criteria.'
    },
    {
      number: '04',
      icon: <FaCheckCircle />,
      title: 'Get Results',
      description: 'Receive a curated list of matching trials with eligibility details, locations, and contact information.'
    }
  ];

  return (
    <section className="how-it-works" id="how-it-works">
      <div className="how-it-works-container">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Three simple steps to find the perfect clinical trial match
          </p>
        </div>
        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-number">{step.number}</div>
              <div className="step-icon-wrapper">
                <div className="step-icon">
                  {step.icon}
                </div>
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
              {index < steps.length - 1 && (
                <div className="step-connector">
                  <div className="connector-line"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

