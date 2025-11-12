import React, { useState } from 'react';
import { FaFileAlt, FaPlay } from 'react-icons/fa';
import './TranscriptInput.css';

interface TranscriptInputProps {
  onSubmit: (transcript: string) => void;
  loading: boolean;
}

const SAMPLE_TRANSCRIPT = `Doctor: Good morning, Sarah. Please have a seat. How have you been feeling since your last visit?

Patient: Hi Doctor Johnson. Thank you for seeing me. Honestly, I've been pretty worried. I'm 45 years old, and I've been having these headaches that just won't go away. They started maybe three months ago, and they're getting worse.

Doctor: I'm sorry to hear that. Can you describe the headaches for me? What do they feel like, and when do they typically occur?

Patient: They're really bad in the morning when I wake up - like a throbbing pain that makes it hard to get out of bed. They usually get a bit better as the day goes on, but they never completely go away. I've also been having trouble with my vision - things look blurry sometimes, especially when I'm reading or looking at a computer screen.

Doctor: Have you noticed any other symptoms? Any nausea, vomiting, or changes in your balance?

Patient: Yes, actually. I've felt nauseous a few times, especially in the morning. And... this is hard to say, but I think I might have had a seizure about a month ago. I was at work and I just kind of blanked out for a few seconds. My coworker said I looked confused and didn't respond when she called my name.

Doctor: I see. Thank you for sharing that - I know it can be difficult to talk about. Based on what you're describing - the morning headaches, vision changes, nausea, and that episode you mentioned - I'm concerned we might be dealing with something in your brain. We need to get some imaging done to see what's going on. I'd like to order an MRI of your brain with contrast.

Patient: Oh my god. Is it... could it be a tumor? I'm so scared. I have two young children at home.

Doctor: I understand this is frightening, and I want to be honest with you. The symptoms you're describing could indicate a brain tumor, possibly a glioblastoma. But let's not jump to conclusions - we need the MRI results first to know for certain what we're dealing with. The good news is that we're catching this early, and there are treatment options available.

Patient: What kind of treatments? I live in San Francisco - can I get treatment here?

Doctor: Absolutely. If the MRI confirms a glioblastoma, the standard approach is typically surgery to remove as much of the tumor as possible, followed by radiation therapy and chemotherapy. We'd likely use a medication called temozolomide. But I also want you to know that there are ongoing clinical trials for glioblastoma that might be options for you, particularly trials involving immunotherapy or targeted therapies that could be more effective than standard treatment alone.

Patient: Clinical trials? Are those safe? I mean, I want to do whatever gives me the best chance, but I'm worried about being a guinea pig.

Doctor: That's a very valid concern, and I'm glad you asked. Clinical trials are carefully regulated and monitored. They're often testing treatments that have shown promise in earlier studies. Many patients find that participating in a trial gives them access to cutting-edge treatments they might not otherwise have. We can discuss specific trials once we have your diagnosis confirmed, and I can help you understand the risks and benefits of each option.

Patient: Okay. So what happens next? When can I get the MRI?

Doctor: I'll have my office schedule it as soon as possible - ideally within the next few days. Once we have those results, we'll meet again to discuss the findings and create a treatment plan. In the meantime, if your symptoms get worse, especially if you have another seizure or severe headache, go to the emergency room immediately. Do you have any other questions right now?

Patient: I think that's all for now. Thank you for being so thorough and honest with me. I really appreciate it.

Doctor: Of course. We're going to get through this together. My office will call you today to schedule the MRI, and we'll go from there. Take care, Sarah.`;

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
