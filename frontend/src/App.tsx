import React, { useState } from 'react';
import './App.css';
import TranscriptInput from './components/TranscriptInput';
import ResultsDisplay from './components/ResultsDisplay';
import PatientDataDisplay from './components/PatientDataDisplay';
import SearchParametersPanel from './components/SearchParametersPanel';
import { PatientData, ClinicalTrial } from './types';

function App() {
  const [loading, setLoading] = useState(false);
  const [refineLoading, setRefineLoading] = useState(false);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [originalPatientData, setOriginalPatientData] = useState<PatientData | null>(null);
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      // Log the API call to console
      console.log('Refine Search API Call:', {
        url: '/api/search-trials',
        diagnosis: updatedPatientData.diagnosis,
        intervention: updatedPatientData.intervention,
        location: updatedPatientData.location_city || updatedPatientData.location_state || updatedPatientData.location_country,
        status: updatedPatientData.status_preference,
        phase: updatedPatientData.phase_preference,
      });

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
      console.log('Refine Search Success - Trials Found:', data.trials?.length || 0);
      
      setTrials(data.trials || []);
      setPatientData(updatedPatientData); // Update patient data with edited values
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
        <h1>TrialScribe</h1>
        <p className="subtitle">Find relevant clinical trials from patient-doctor conversations</p>
      </header>

      <main className="App-main">
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
          <ResultsDisplay trials={trials} />
        )}
      </main>
    </div>
  );
}

export default App;
