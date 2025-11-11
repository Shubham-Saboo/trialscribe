import React, { useState } from 'react';
import './TranscriptInput.css';

interface TranscriptInputProps {
  onSubmit: (transcript: string) => void;
  loading: boolean;
}

const SAMPLE_TRANSCRIPT = `Doctor: Good morning, Sarah. How are you feeling today?

Patient: Hi Doctor. I've been experiencing some concerning symptoms over the past few months. I'm a 45-year-old woman living in San Francisco, and I've been having persistent headaches, especially in the morning, along with some vision problems.

Doctor: I see. Can you tell me more about these headaches? When did they start?

Patient: They started about three months ago. They're worse in the morning and seem to get better throughout the day. I've also noticed that my vision has been blurry, and I've been having seizures occasionally.

Doctor: I understand. Based on your symptoms - persistent morning headaches, vision problems, and seizures - I'm concerned about the possibility of glioblastoma, which is a type of brain tumor. We'll need to do some imaging studies to confirm. Specifically, I'd like to order an MRI of your brain.

Patient: Oh no. That sounds serious. What are the next steps?

Doctor: Yes, this is something we need to investigate promptly. The MRI will help us see what's going on. Depending on the results, we may need to discuss treatment options. For glioblastoma, we typically consider surgical resection followed by radiation therapy and chemotherapy. Specifically, we might use temozolomide as the chemotherapy agent. There are also clinical trials available for glioblastoma that might be relevant, especially those involving immunotherapy or targeted therapy.

Patient: I'm willing to do whatever it takes. I have two children, and I want to be there for them. I'm open to exploring clinical trials, especially if they're available here in the Bay Area or nearby.

Doctor: I understand. Let's start with the MRI, and then we'll discuss the best treatment plan based on the results. I'll also make sure you're aware of any relevant clinical trials that might be available for your specific condition. Since you're in San Francisco, there are several major medical centers nearby that participate in glioblastoma clinical trials.

Patient: Thank you, Doctor. I appreciate your help.`;

const TranscriptInput: React.FC<TranscriptInputProps> = ({ onSubmit, loading }) => {
  const [transcript, setTranscript] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transcript.trim()) {
      onSubmit(transcript);
    }
  };

  const handleUseSample = () => {
    setTranscript(SAMPLE_TRANSCRIPT);
  };

  return (
    <div className="transcript-input-container">
      <form onSubmit={handleSubmit} className="transcript-form">
        <div className="form-header">
          <h2>Enter Patient-Doctor Conversation Transcript</h2>
          <button
            type="button"
            onClick={handleUseSample}
            className="sample-button"
            disabled={loading}
          >
            Use Sample Transcript
          </button>
        </div>
        
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste the patient-doctor conversation transcript here..."
          className="transcript-textarea"
          rows={15}
          disabled={loading}
          required
        />
        
        <button
          type="submit"
          className="submit-button"
          disabled={loading || !transcript.trim()}
        >
          {loading ? 'Processing...' : 'Find Clinical Trials'}
        </button>
      </form>
    </div>
  );
};

export default TranscriptInput;
