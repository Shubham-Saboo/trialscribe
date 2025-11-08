import React, { useState } from 'react';
import './App.css';
import TranscriptInput from './components/TranscriptInput';
import ResultsDisplay from './components/ResultsDisplay';
import PatientDataDisplay from './components/PatientDataDisplay';
import { PatientData, ClinicalTrial } from './types';

function App() {
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (transcript: string) => {
    setLoading(true);
    setError(null);
    setPatientData(null);
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
      setTrials(data.trials || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
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

        {trials.length > 0 && (
          <ResultsDisplay trials={trials} />
        )}
      </main>
    </div>
  );
}

export default App;
