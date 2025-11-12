import React from 'react';
import { FaClock, FaUser, FaFlask, FaCheckCircle } from 'react-icons/fa';
import './StatsSection.css';

const StatsSection: React.FC = () => {
  const stats = [
    {
      icon: <FaClock />,
      value: '10x',
      label: 'Faster than manual search',
      description: 'Find trials in seconds'
    },
    {
      icon: <FaUser />,
      value: '500+',
      label: 'Healthcare professionals',
      description: 'Trust TrialScribe daily'
    },
    {
      icon: <FaFlask />,
      value: '400K+',
      label: 'Clinical trials indexed',
      description: 'From ClinicalTrials.gov'
    },
    {
      icon: <FaCheckCircle />,
      value: '95%',
      label: 'Matching accuracy',
      description: 'AI-powered precision'
    }
  ];

  return (
    <section className="stats-section">
      <div className="stats-container">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">
              {stat.icon}
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-description">{stat.description}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;

