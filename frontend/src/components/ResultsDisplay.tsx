import React, { useState, useMemo, useEffect } from 'react';
import './ResultsDisplay.css';
import { ClinicalTrial } from '../types';

interface ResultsDisplayProps {
  trials: ClinicalTrial[];
}

const RESULTS_PER_PAGE = 5;
const MAX_PAGES = 10;
const MAX_RESULTS = RESULTS_PER_PAGE * MAX_PAGES; // 50

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ trials }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Limit trials to max 50 (10 pages × 5 per page)
  const limitedTrials = useMemo(() => {
    return trials.slice(0, MAX_RESULTS);
  }, [trials]);

  // Convert trials to CSV format
  const convertToCSV = (trialsToExport: ClinicalTrial[]): string => {
    const headers = ['NCT ID', 'Title', 'Official Title', 'Status', 'Phase', 'Conditions', 'Summary', 'Locations', 'URL'];
    const rows = trialsToExport.map(trial => {
      // Escape quotes and wrap in quotes for fields that may contain commas
      const escapeCSV = (value: string | null | undefined): string => {
        if (!value) return '';
        return `"${String(value).replace(/"/g, '""')}"`;
      };
      
      return [
        trial.nct_id,
        escapeCSV(trial.title),
        escapeCSV(trial.official_title),
        escapeCSV(trial.status),
        escapeCSV(trial.phase.join('; ')),
        escapeCSV(trial.conditions.join('; ')),
        escapeCSV(trial.summary),
        escapeCSV(trial.locations.join('; ')), // Join multiple locations with semicolon, wrap in quotes
        escapeCSV(trial.url)
      ];
    });
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  // Download trials as CSV
  const handleDownloadCSV = () => {
    const csv = convertToCSV(limitedTrials);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clinical-trials-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download trials as JSON
  const handleDownloadJSON = () => {
    const json = JSON.stringify(limitedTrials, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clinical-trials-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate pagination
  const totalPages = Math.min(Math.ceil(limitedTrials.length / RESULTS_PER_PAGE), MAX_PAGES);
  const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
  const endIndex = startIndex + RESULTS_PER_PAGE;
  const paginatedTrials = limitedTrials.slice(startIndex, endIndex);

  // Reset to page 1 when trials change
  useEffect(() => {
    setCurrentPage(1);
  }, [trials]);

  const toggleExpand = (nctId: string) => {
    setExpandedId(expandedId === nctId ? null : nctId);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    setExpandedId(null); // Collapse expanded items when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (trials.length === 0) {
    return (
      <div className="results-container">
        <h2>Clinical Trial Matches</h2>
        <p className="no-results">No trials found. Please adjust your filtering criteria.</p>
      </div>
    );
  }

  const totalDisplayed = limitedTrials.length;
  const showingFrom = startIndex + 1;
  const showingTo = Math.min(endIndex, totalDisplayed);

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>Clinical Trial Matches ({totalDisplayed}{trials.length > MAX_RESULTS ? ` of ${trials.length}` : ''})</h2>
        {limitedTrials.length > 0 && (
          <div className="download-buttons">
            <button onClick={handleDownloadCSV} className="download-button" title="Download as CSV">
              📥 CSV
            </button>
            <button onClick={handleDownloadJSON} className="download-button" title="Download as JSON">
              📥 JSON
            </button>
          </div>
        )}
      </div>
      
      {trials.length > MAX_RESULTS && (
        <p className="results-limit-notice">
          Showing first {MAX_RESULTS} results (maximum {MAX_PAGES} pages)
        </p>
      )}

      <div className="trials-list">
        {paginatedTrials.map((trial) => (
          <div key={trial.nct_id} className="trial-card">
            <div className="trial-header">
              <h3 className="trial-title">{trial.title}</h3>
              <span className={`status-badge status-${trial.status.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-')}`}>
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
            
            <div className="trial-footer">
              <button
                className="expand-button"
                onClick={() => toggleExpand(trial.nct_id)}
              >
                {expandedId === trial.nct_id ? 'Show Less' : 'Show More Details'}
              </button>
            
            <a
              href={trial.url}
              target="_blank"
              rel="noopener noreferrer"
              className="trial-link"
            >
              View on ClinicalTrials.gov →
            </a>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {showingFrom}-{showingTo} of {totalDisplayed} results
          </div>
          
          <div className="pagination-controls">
            <button
              className="pagination-button"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              aria-label="First page"
            >
              ««
            </button>
            <button
              className="pagination-button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              ‹
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                onClick={() => goToPage(page)}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            ))}
            
            <button
              className="pagination-button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              ›
            </button>
            <button
              className="pagination-button"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last page"
            >
              »»
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;

