import React, { useState } from 'react';
import './TranscriptInput.css';

interface TranscriptInputProps {
  onSubmit: (transcript: string) => void;
  loading: boolean;
}

const SAMPLE_TRANSCRIPT = `Doctor: Good morning, Sarah. How are you feeling today?

Patient: Hi Doctor. I've been experiencing some concerning symptoms over the past few months. I'm a 45-year-old woman, and I've been having persistent headaches, especially in the morning, along with some vision problems.

Doctor: I see. Can you tell me more about these headaches? When did they start?

Patient: They started about three months ago. They're worse in the morning and seem to get better throughout the day. I've also noticed that my vision has been blurry, and I've been feeling nauseous.

Doctor: Have you noticed any other symptoms? Any changes in your coordination or balance?

Patient: Yes, actually. I've been feeling a bit unsteady on my feet, and I've had some difficulty with fine motor tasks, like buttoning my shirt.

Doctor: I understand. Based on your symptoms - persistent morning headaches, vision problems, nausea, and coordination issues - I'm concerned about the possibility of a brain tumor. We'll need to do some imaging studies to confirm. Specifically, I'd like to order an MRI of your brain.

Patient: Oh no. That sounds serious. What are the next steps?

Doctor: Yes, this is something we need to investigate promptly. The MRI will help us see what's going on. Depending on the results, we may need to discuss treatment options, which could include surgery, radiation therapy, or chemotherapy. There are also clinical trials available for certain types of brain tumors that might be relevant.

Patient: I'm willing to do whatever it takes. I have two children, and I want to be there for them.

Doctor: I understand. Let's start with the MRI, and then we'll discuss the best treatment plan based on the results. I'll also make sure you're aware of any relevant clinical trials that might be available for your specific condition.

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
