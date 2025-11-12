import React from 'react';
import { FaStar } from 'react-icons/fa';
import './Testimonials.css';

interface Testimonial {
  name: string;
  role: string;
  organization: string;
  image?: string;
  rating: number;
  text: string;
}

const Testimonials: React.FC = () => {
  const testimonials: Testimonial[] = [
    {
      name: 'Dr. Sarah Chen',
      role: 'Oncologist',
      organization: 'Memorial Hospital',
      rating: 5,
      text: 'TrialScribe has revolutionized how we find clinical trials for our patients. What used to take hours now takes minutes. The AI extraction is incredibly accurate, and the matching is spot-on.'
    },
    {
      name: 'Dr. Michael Rodriguez',
      role: 'Clinical Research Coordinator',
      organization: 'City Medical Center',
      rating: 5,
      text: 'As someone who searches for clinical trials daily, TrialScribe is a game-changer. The interface is intuitive, and the results are always relevant. It\'s become an essential tool in our practice.'
    },
    {
      name: 'Dr. Emily Watson',
      role: 'Family Physician',
      organization: 'Community Health Clinic',
      rating: 5,
      text: 'I love how easy it is to use. Just paste the conversation, and TrialScribe does the rest. My patients appreciate that I can find relevant trials so quickly. Highly recommend!'
    }
  ];

  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        <div className="section-header">
          <h2 className="section-title">Trusted by Healthcare Professionals</h2>
          <p className="section-subtitle">
            See what doctors and researchers are saying about TrialScribe
          </p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar">
                  {testimonial.name.charAt(0)}
                </div>
                <div className="testimonial-info">
                  <div className="testimonial-name">{testimonial.name}</div>
                  <div className="testimonial-role">{testimonial.role}</div>
                  <div className="testimonial-org">{testimonial.organization}</div>
                </div>
              </div>
              <div className="testimonial-rating">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <FaStar key={i} className="star-icon" />
                ))}
              </div>
              <div className="testimonial-quote">
                <span className="quote-icon">"</span>
                <p>{testimonial.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

