import React, { useState } from 'react';
import './ResultsDisplay.css';
import { ClinicalTrial } from '../types';

interface ResultsDisplayProps {
  trials: ClinicalTrial[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ trials }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (nctId: string) => {
    setExpandedId(expandedId === nctId ? null : nctId);
  };

  if (trials.length === 0) {
    return (
      <div className="results-container">
        <h2>Clinical Trial Matches</h2>
        <p className="no-results">No matching clinical trials found.</p>
      </div>
    );
  }

  return (
    <div className="results-container">
      <h2>Clinical Trial Matches ({trials.length})</h2>
      <div className="trials-list">
        {trials.map((trial) => (
          <div key={trial.nct_id} className="trial-card">
            <div className="trial-header">
              <h3 className="trial-title">{trial.title}</h3>
              <span className={`status-badge status-${trial.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {trial.status}
              </span>
            </div>
            
            <div className="trial-meta">
              <span className="nct-id">NCT ID: {trial.nct_id}</span>
              {trial.phase.length > 0 && (
                <span className="phase">Phase: {trial.phase.join(', ')}</span>
              )}
            </div>
            
            {trial.conditions.length > 0 && (
              <div className="trial-conditions">
                <strong>Conditions:</strong>
                <div className="conditions-list">
                  {trial.conditions.map((condition, idx) => (
                    <span key={idx} className="condition-badge">{condition}</span>
                  ))}
                </div>
              </div>
            )}
            
            {trial.summary && (
              <div className="trial-summary">
                <p>{trial.summary.substring(0, 200)}...</p>
              </div>
            )}
            
            <button
              className="expand-button"
              onClick={() => toggleExpand(trial.nct_id)}
            >
              {expandedId === trial.nct_id ? 'Show Less' : 'Show More Details'}
            </button>
            
            {expandedId === trial.nct_id && (
              <div className="trial-details">
                {trial.official_title && trial.official_title !== trial.title && (
                  <div className="detail-section">
                    <strong>Official Title:</strong>
                    <p>{trial.official_title}</p>
                  </div>
                )}
                
                {trial.summary && (
                  <div className="detail-section">
                    <strong>Summary:</strong>
                    <p>{trial.summary}</p>
                  </div>
                )}
                
                {trial.eligibility_criteria && (
                  <div className="detail-section">
                    <strong>Eligibility Criteria:</strong>
                    <div className="eligibility-text">{trial.eligibility_criteria}</div>
                  </div>
                )}
                
                {trial.locations.length > 0 && (
                  <div className="detail-section">
                    <strong>Locations:</strong>
                    <ul className="locations-list">
                      {trial.locations.map((location, idx) => (
                        <li key={idx}>{location}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <a
              href={trial.url}
              target="_blank"
              rel="noopener noreferrer"
              className="trial-link"
            >
              View on ClinicalTrials.gov →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsDisplay;

