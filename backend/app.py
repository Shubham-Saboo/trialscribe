from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from services.llm_extractor import extract_patient_data
from services.trials_finder import find_clinical_trials

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200

@app.route('/api/extract-and-match', methods=['POST'])
def extract_and_match():
    """
    Main endpoint that extracts patient data from transcript
    and finds matching clinical trials
    """
    try:
        data = request.get_json()
        transcript = data.get('transcript')
        
        if not transcript:
            return jsonify({"error": "Transcript is required"}), 400
        
        # Extract patient data using LLM
        patient_data = extract_patient_data(transcript)
        
        if not patient_data:
            return jsonify({"error": "Failed to extract patient data"}), 500
        
        # Find matching clinical trials
        trials = find_clinical_trials(patient_data)
        
        return jsonify({
            "patient_data": patient_data,
            "trials": trials,
            "transcript_length": len(transcript)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
