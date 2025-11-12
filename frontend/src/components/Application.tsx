import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import TranscriptInput from './TranscriptInput';
import ResultsDisplay from './ResultsDisplay';
import PatientDataDisplay from './PatientDataDisplay';
import SearchParametersPanel from './SearchParametersPanel';
import EmptyState from './EmptyState';
import { PatientData, ClinicalTrial } from '../types';
import { useFavorites } from '../hooks/useFavorites';
import { API_ENDPOINTS } from '../config';
import '../App.css';

type TabType = 'search' | 'favorites';

const Application: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [refineLoading, setRefineLoading] = useState(false);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [originalPatientData, setOriginalPatientData] = useState<PatientData | null>(null);
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const { getFavoriteTrials, favoritesCount, toggleFavorite, isFavorite } = useFavorites();

  const handleSubmit = async (transcript: string) => {
    setLoading(true);
    setError(null);
    setPatientData(null);
    setOriginalPatientData(null);
    setTrials([]);

    try {
      const response = await fetch(API_ENDPOINTS.EXTRACT_AND_MATCH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process transcript');
      }

      const data = await response.json();
      setPatientData(data.patient_data);
      setOriginalPatientData(data.patient_data);
      setTrials(data.trials || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRefineSearch = async (updatedPatientData: PatientData) => {
    setRefineLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.SEARCH_TRIALS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patient_data: updatedPatientData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to refine search');
      }

      const data = await response.json();
      setTrials(data.trials || []);
      setPatientData(updatedPatientData);
    } catch (err) {
      console.error('Refine Search Error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setRefineLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <Link to="/" className="app-logo-link">
          <h1>TrialScribe</h1>
        </Link>
        <p className="subtitle">AI-Powered Clinical Trial Discovery • Find Trials in Seconds, Not Hours</p>
      </header>

      <main className="App-main">
        <div id="transcript-input">
          <TranscriptInput onSubmit={handleSubmit} loading={loading} />
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {patientData && (
          <PatientDataDisplay patientData={patientData} />
        )}

        {patientData && originalPatientData && (
          <SearchParametersPanel
            patientData={patientData}
            originalPatientData={originalPatientData}
            onRefineSearch={handleRefineSearch}
            loading={refineLoading}
          />
        )}

        {patientData && (
          <>
            {(trials.length > 0 || favoritesCount > 0) && (
              <div className="tabs-container">
                <div className="tabs">
                  <button
                    className={`tab ${activeTab === 'search' ? 'active' : ''}`}
                    onClick={() => setActiveTab('search')}
                  >
                    Search Results {trials.length > 0 && `(${trials.length})`}
                  </button>
                  <button
                    className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
                    onClick={() => setActiveTab('favorites')}
                  >
                    <FaStar />
                    Favorites {favoritesCount > 0 && `(${favoritesCount})`}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'search' && (
              <>
                {trials.length === 0 && !refineLoading ? (
                  <EmptyState type="no-results" />
                ) : (
                  <ResultsDisplay 
                    trials={trials} 
                    showBookmarks={true}
                    toggleFavorite={toggleFavorite}
                    isFavorite={isFavorite}
                  />
                )}
              </>
            )}

            {activeTab === 'favorites' && (
              <>
                {favoritesCount === 0 ? (
                  <EmptyState type="no-favorites" />
                ) : (
                  <ResultsDisplay 
                    trials={getFavoriteTrials()} 
                    showBookmarks={true}
                    toggleFavorite={toggleFavorite}
                    isFavorite={isFavorite}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Application;

