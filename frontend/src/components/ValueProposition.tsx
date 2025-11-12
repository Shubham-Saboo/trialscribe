import React from 'react';
import { FaClock, FaStar, FaSearch, FaCheckCircle } from 'react-icons/fa';
import './ValueProposition.css';

const ValueProposition: React.FC = () => {
  const benefits = [
    {
      icon: <FaClock />,
      title: '10x Faster',
      description: 'Get matched trials in seconds instead of spending hours searching through outdated databases.'
    },
    {
      icon: <FaStar />,
      title: 'AI-Powered Intelligence',
      description: 'Advanced natural language processing extracts patient data automatically from conversations.'
    },
    {
      icon: <FaSearch />,
      title: 'Precision Matching',
      description: 'Our algorithm matches patients with trials based on diagnosis, location, age, and eligibility criteria.'
    },
    {
      icon: <FaCheckCircle />,
      title: 'Secure & Private',
      description: 'HIPAA-compliant platform ensuring patient data privacy and security at every step.'
    }
  ];

  return (
    <section className="value-proposition">
      <div className="value-proposition-container">
        <div className="section-header">
          <h2 className="section-title">Why TrialScribe?</h2>
          <p className="section-subtitle">
            The modern way to discover clinical trials. Built for healthcare professionals who value their time.
          </p>
        </div>
        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-card">
              <div className="benefit-icon">
                {benefit.icon}
              </div>
              <h3 className="benefit-title">{benefit.title}</h3>
              <p className="benefit-description">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;

