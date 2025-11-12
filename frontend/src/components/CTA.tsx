import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import './CTA.css';

const CTA: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="cta-section" id="try-it">
      <div className="cta-container">
        <div className="cta-content">
          <FaStar className="cta-rocket-icon" />
          <h2 className="cta-title">Ready to Transform Clinical Trial Discovery?</h2>
          <p className="cta-description">
            Join hundreds of healthcare professionals who are already using TrialScribe 
            to find clinical trials faster and more accurately.
          </p>
          <div className="cta-buttons">
            <button 
              className="cta-button-primary"
              onClick={() => navigate('/app')}
            >
              Get Started Free
              →
            </button>
            <a 
              href="#how-it-works" 
              className="cta-button-secondary"
              onClick={(e) => {
                e.preventDefault();
                const element = document.querySelector('.how-it-works');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Learn How It Works
            </a>
          </div>
          <p className="cta-note">No credit card required • Free forever</p>
        </div>
      </div>
    </section>
  );
};

export default CTA;

