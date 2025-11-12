"""
TrialScribe Flask Application
Main API server for clinical trial matching service
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from services.llm_extractor import extract_patient_data
from services.trials_finder import find_clinical_trials
from services.trial_chatbot import chat_about_trial
from services.models import ExtractAndMatchResponse, SearchTrialsResponse, PatientData, ClinicalTrial
from services.exceptions import (
    PatientDataExtractionError,
    ClinicalTrialsAPIError,
    InvalidInputError,
    TrialScribeException
)
from services.logger import get_logger
from config import Config

# Validate configuration on startup
Config.validate()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

logger = get_logger("app")


@app.route('/health', methods=['GET'])
def health():
    """
    Health check endpoint
    
    Returns:
        JSON response with status
    """
    return jsonify({"status": "healthy", "service": "trialscribe"}), 200


@app.route('/api/extract-and-match', methods=['POST'])
def extract_and_match():
    """
    Main endpoint that extracts patient data from transcript
    and finds matching clinical trials using LangChain v1.0 and Pydantic
    
    Request Body:
        {
            "transcript": "Patient-doctor conversation transcript..."
        }
    
    Returns:
        JSON response with patient data and matching clinical trials
    """
    try:
        # Validate request
        if not request.is_json:
            raise InvalidInputError("Request must be JSON")
        
        data = request.get_json()
        if not data:
            raise InvalidInputError("Request body cannot be empty")
        
        transcript = data.get('transcript')
        if not transcript:
            raise InvalidInputError("Transcript is required")
        
        logger.info(f"Processing extract-and-match request: transcript_length={len(transcript)}")
        
        # Extract patient data using LLM with structured output
        patient_data = extract_patient_data(transcript)
        
        # Find matching clinical trials
        trials = find_clinical_trials(patient_data)
        
        # Create response using Pydantic model
        response = ExtractAndMatchResponse(
            patient_data=patient_data,
            trials=trials,
            transcript_length=len(transcript)
        )
        
        return jsonify(response.model_dump()), 200
        
    except InvalidInputError as e:
        logger.warning(f"Invalid input: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except PatientDataExtractionError as e:
        logger.error(f"Patient data extraction failed: {str(e)}")
        return jsonify({"error": str(e)}), 500
    except ClinicalTrialsAPIError as e:
        logger.error(f"Clinical trials API error: {str(e)}")
        return jsonify({"error": str(e)}), 502
    except TrialScribeException as e:
        logger.error(f"Application error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred"}), 500


@app.route('/api/search-trials', methods=['POST'])
def search_trials():
    """
    Endpoint to search for clinical trials using PatientData directly.
    Allows users to refine search parameters without re-extracting from transcript.
    
    Request Body:
        {
            "patient_data": {
                "diagnosis": "glioblastoma",
                "intervention": "temozolomide",
                "location_city": "San Francisco",
                "location_state": "California",
                "status_preference": "RECRUITING,NOT_YET_RECRUITING",
                ...
            }
        }
    
    Returns:
        JSON response with matching clinical trials
    """
    try:
        # Validate request
        if not request.is_json:
            raise InvalidInputError("Request must be JSON")
        
        data = request.get_json()
        if not data:
            raise InvalidInputError("Request body cannot be empty")
        
        patient_data_dict = data.get('patient_data')
        if not patient_data_dict:
            raise InvalidInputError("patient_data is required")
        
        logger.info(f"Processing search-trials request: diagnosis={patient_data_dict.get('diagnosis')}")
        
        # Validate and convert to PatientData model
        try:
            patient_data = PatientData.model_validate(patient_data_dict)
        except Exception as e:
            raise InvalidInputError(f"Invalid patient_data format: {str(e)}")
        
        # Find matching clinical trials
        trials = find_clinical_trials(patient_data)
        
        # Create response using Pydantic model
        response = SearchTrialsResponse(trials=trials)
        
        return jsonify(response.model_dump()), 200
        
    except InvalidInputError as e:
        logger.warning(f"Invalid input: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except ClinicalTrialsAPIError as e:
        logger.error(f"Clinical trials API error: {str(e)}")
        return jsonify({"error": str(e)}), 502
    except TrialScribeException as e:
        logger.error(f"Application error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred"}), 500


@app.route('/api/trial-chat', methods=['POST'])
def trial_chat():
    """
    Endpoint for Q&A chatbot about a specific clinical trial.
    
    Request Body:
        {
            "nct_id": "NCT12345678",
            "question": "What are the eligibility requirements?",
            "chat_history": [
                {"role": "user", "content": "What is this trial about?"},
                {"role": "assistant", "content": "This trial is about..."}
            ],
            "trial": {
                // Full ClinicalTrial object
            }
        }
    
    Returns:
        JSON response with AI answer
    """
    try:
        # Validate request
        if not request.is_json:
            raise InvalidInputError("Request must be JSON")
        
        data = request.get_json()
        if not data:
            raise InvalidInputError("Request body cannot be empty")
        
        question = data.get('question')
        if not question:
            raise InvalidInputError("Question is required")
        
        trial_dict = data.get('trial')
        if not trial_dict:
            raise InvalidInputError("Trial information is required")
        
        # Validate and convert to ClinicalTrial model
        try:
            trial = ClinicalTrial.model_validate(trial_dict)
        except Exception as e:
            raise InvalidInputError(f"Invalid trial format: {str(e)}")
        
        chat_history = data.get('chat_history', [])
        
        logger.info(f"Processing trial chat: nct_id={trial.nct_id}, question_length={len(question)}")
        
        # Get AI response using existing LLM client
        answer = chat_about_trial(trial, question, chat_history)
        
        return jsonify({
            "answer": answer,
            "nct_id": trial.nct_id
        }), 200
        
    except InvalidInputError as e:
        logger.warning(f"Invalid input: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except TrialScribeException as e:
        logger.error(f"Trial chat error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred"}), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors"""
    return jsonify({"error": "Method not allowed"}), 405


if __name__ == '__main__':
    logger.info(f"Starting TrialScribe server on port {Config.PORT}")
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)
