import React, { useState, useMemo } from 'react';
import { FaStar } from 'react-icons/fa';
import './App.css';
import TranscriptInput from './components/TranscriptInput';
import ResultsDisplay from './components/ResultsDisplay';
import PatientDataDisplay from './components/PatientDataDisplay';
import SearchParametersPanel from './components/SearchParametersPanel';
import HeroSection from './components/HeroSection';
import StepIndicator, { Step } from './components/StepIndicator';
import EmptyState from './components/EmptyState';
import { PatientData, ClinicalTrial } from './types';
import { useFavorites } from './hooks/useFavorites';

type TabType = 'search' | 'favorites';

function App() {
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
      const response = await fetch('/api/extract-and-match', {
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
      setOriginalPatientData(data.patient_data); // Store original data for reset
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
      const response = await fetch('/api/search-trials', {
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
      setPatientData(updatedPatientData); // Update patient data with edited values
    } catch (err) {
      console.error('Refine Search Error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setRefineLoading(false);
    }
  };

  // Determine current step based on application state
  const currentStep: Step = useMemo(() => {
    if (trials.length > 0) return 'results';
    if (patientData && originalPatientData) return 'search'; // Search panel is active
    if (patientData) return 'patient'; // Patient data extracted, but not searching yet
    return 'input';
  }, [patientData, originalPatientData, trials]);

  const handleStepClick = (step: Step) => {
    // Allow navigation back to previous steps
    // For now, we'll just scroll to the relevant section
    // In a more advanced implementation, we could manage step state
    if (step === 'input' && patientData) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>TrialScribe</h1>
        <p className="subtitle">Find relevant clinical trials from patient-doctor conversations</p>
      </header>

      <main className="App-main">
        {!patientData && !loading && (
          <HeroSection />
        )}

        {patientData && (
          <StepIndicator currentStep={currentStep} onStepClick={handleStepClick} />
        )}

        <TranscriptInput onSubmit={handleSubmit} loading={loading} />

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
}

export default App;
