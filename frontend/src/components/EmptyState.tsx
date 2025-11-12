import React from 'react';
import { FaInbox, FaSearch, FaStar } from 'react-icons/fa';
import './EmptyState.css';

interface EmptyStateProps {
  type: 'no-results' | 'no-data' | 'no-favorites';
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

  if (type === 'no-favorites') {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <FaStar />
        </div>
        <h3>No Favorites Yet</h3>
        <p>{message || "You haven't bookmarked any trials yet. Click the star icon on any trial to add it to your favorites."}</p>
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

