import React, { useState } from 'react';
import { FaFileAlt, FaPlay } from 'react-icons/fa';
import './TranscriptInput.css';

interface TranscriptInputProps {
  onSubmit: (transcript: string) => void;
  loading: boolean;
}

const SAMPLE_TRANSCRIPT = `Doctor: Good morning, Sarah. Please have a seat. I have your MRI results back, and I'd like to discuss them with you.

Patient: Hi Doctor Johnson. Thank you for seeing me. I'm 45 years old, and I've been so anxious waiting for these results. What did the MRI show?

Doctor: I understand this has been a difficult wait. Let me be direct with you about the findings. Based on the MRI results, you are reported to have glioblastoma. This is a type of brain tumor that requires immediate treatment.

Patient: Oh my god. Glioblastoma? I'm so scared. I have two young children at home. What does this mean?

Doctor: I know this is frightening news, and I want you to know that we're going to work together on this. Glioblastoma is a serious condition, but there are treatment options available. Your treatment plan will involve surgery to remove as much of the tumor as possible, followed by radiation therapy and chemotherapy.

Patient: What kind of chemotherapy? I live in San Francisco - can I get treatment here?

Doctor: Absolutely, we can coordinate your treatment here in San Francisco. Your intervention or your treatment would be using temozolomide. This is a chemotherapy medication that's specifically used for glioblastoma and has shown effectiveness when combined with radiation therapy.

Patient: Temozolomide? I've never heard of that. How does it work?

Doctor: Temozolomide is an oral chemotherapy drug that works by damaging the DNA of cancer cells, which helps prevent the tumor from growing. It's typically taken daily during radiation treatment and then continued as maintenance therapy afterward. We'll monitor you closely throughout the treatment process.

Patient: What about side effects? Will I be able to work? I'm worried about how this will affect my family.

Doctor: That's completely understandable. The side effects can vary from person to person. Some patients experience fatigue, nausea, or changes in blood counts. We'll manage these as they come up, and we have medications to help with nausea and other symptoms. Many people are able to continue working, though you may need to adjust your schedule, especially during radiation. Your family is important, and we'll make sure you have the support you need.

Patient: Okay. So what happens next? When do we start treatment?

Doctor: We'll schedule your surgery as soon as possible - ideally within the next week. After surgery, once you've recovered, we'll begin radiation therapy and start you on temozolomide. The whole process will take several months, but we'll take it one step at a time. In the meantime, if your symptoms get worse, especially if you have another seizure or severe headache, go to the emergency room immediately. Do you have any other questions right now?

Patient: I think that's all for now. Thank you for being so thorough and honest with me. I really appreciate it.

Doctor: Of course. We're going to get through this together. My office will call you today to schedule the surgery, and we'll go from there. Take care, Sarah.`;

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
          <h2>
            <FaFileAlt />
            Enter Patient-Doctor Conversation Transcript
          </h2>
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
          <FaPlay />
          {loading ? 'Processing...' : 'Find Clinical Trials'}
        </button>
      </form>
    </div>
  );
};

export default TranscriptInput;
