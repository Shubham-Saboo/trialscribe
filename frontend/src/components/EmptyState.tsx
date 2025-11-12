import React from 'react';
import { FaInbox, FaSearch } from 'react-icons/fa';
import './EmptyState.css';

interface EmptyStateProps {
  type: 'no-results' | 'no-data';
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, message }) => {
  if (type === 'no-results') {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <FaSearch />
        </div>
        <h3>No Trials Found</h3>
        <p>{message || "We couldn't find any clinical trials matching your criteria. Try adjusting your search parameters."}</p>
      </div>
    );
  }

  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <FaInbox />
      </div>
      <h3>No Data Yet</h3>
      <p>{message || "Enter a patient-doctor conversation transcript to get started."}</p>
    </div>
  );
};

export default EmptyState;

