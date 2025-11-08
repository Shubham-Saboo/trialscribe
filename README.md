# TrialScribe - Clinical Trial Matcher

TrialScribe is a full-stack web application that extracts patient information from doctor-patient conversation transcripts using AI and matches them with relevant clinical trials from ClinicalTrials.gov.

## Overview

This application solves the challenge of connecting patients with relevant clinical trials by:

1. **Processing Transcripts**: Accepts patient-doctor conversation transcripts
2. **AI-Powered Extraction**: Uses LangChain with OpenAI's GPT-4 to extract structured patient data (diagnosis, demographics, symptoms, medical history, etc.)
3. **Trial Matching**: Queries the ClinicalTrials.gov API to find relevant, currently recruiting trials
4. **Intuitive Display**: Presents results in a clean, user-friendly interface with expandable trial details

## Tech Stack

- **Backend**: Python 3.9+, Flask, LangChain, OpenAI API
- **Frontend**: TypeScript, React, CSS3
- **APIs**: ClinicalTrials.gov API v2, OpenAI API

## Features

- ✨ Clean, modern UI with responsive design
- 🤖 Intelligent patient data extraction using GPT-4
- 🔍 Smart clinical trial matching based on extracted criteria
- 📋 Detailed trial information with eligibility criteria
- 🔗 Direct links to ClinicalTrials.gov for each trial
- 💾 Sample transcript for quick testing
- ⚡ Fast, efficient API calls with error handling

## Deployment

**Live Demo**: [Deploy your application to Render/Vercel/AWS and add the link here]

### Quick Deploy Options

- **Backend (Flask)**: Deploy to [Render](https://render.com) or [Heroku](https://heroku.com)
- **Frontend (React)**: Deploy to [Vercel](https://vercel.com) or [Netlify](https://netlify.com)

## Local Setup

### Prerequisites

- Python 3.9 or higher
- `uv` package manager ([Installation guide](https://github.com/astral-sh/uv))
- Node.js 16+ and npm
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Backend Setup

1. Install `uv` (if not already installed):
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
# Or with Homebrew: brew install uv
```

2. Navigate to the backend directory:
```bash
cd backend
```

3. Create a virtual environment and install dependencies with `uv`:
```bash
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -r requirements.txt
```

Alternatively, you can use `uv` to sync dependencies directly:
```bash
uv sync
```

4. Create a `.env` file in the `backend` directory:
```bash
cp env.example .env
```

5. Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=5001
```

6. Run the Flask server:
```bash
python app.py
```

The backend will run on `http://localhost:5001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update the API endpoint in `src/App.tsx` if your backend is running on a different URL (the default proxy is set to `http://localhost:5001` in `package.json`)

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000` and automatically open in your browser.

## Usage

1. **Enter Transcript**: Paste a patient-doctor conversation transcript into the text area, or click "Use Sample Transcript" to load a pre-generated example.

2. **Process**: Click "Find Clinical Trials" to extract patient data and search for matching trials.

3. **Review Results**: 
   - View extracted patient information (diagnosis, demographics, symptoms, etc.)
   - Browse matching clinical trials
   - Click "Show More Details" to see eligibility criteria, locations, and full summaries
   - Click "View on ClinicalTrials.gov" to see the official trial page

## Project Structure

```
trialscribe/
├── backend/
│   ├── app.py                 # Flask application entry point
│   ├── services/
│   │   ├── llm_extractor.py  # LangChain-based patient data extraction
│   │   └── trials_finder.py  # ClinicalTrials.gov API integration
│   ├── requirements.txt       # Python dependencies
│   └── .env.example          # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main React component
│   │   ├── components/       # React components
│   │   │   ├── TranscriptInput.tsx
│   │   │   ├── PatientDataDisplay.tsx
│   │   │   └── ResultsDisplay.tsx
│   │   └── types.ts          # TypeScript type definitions
│   ├── package.json          # Node.js dependencies
│   └── tsconfig.json         # TypeScript configuration
└── README.md                  # This file
```

## Assumptions & Design Decisions

1. **LLM Model**: Using GPT-4o-mini for cost-effectiveness while maintaining good extraction quality. Can be easily upgraded to GPT-4 for better accuracy.

2. **Trial Filtering**: Currently filters for "RECRUITING" status trials and limits results to 10 for performance. The query prioritizes diagnosis/condition matching.

3. **Error Handling**: Graceful fallbacks if LLM extraction fails or API calls timeout. User-friendly error messages displayed in the UI.

4. **Data Extraction**: The LLM extracts structured data using Pydantic models for type safety and validation. Only extracts explicitly mentioned information to avoid hallucinations.

5. **Frontend Proxy**: Uses React's proxy configuration for development. For production, update API endpoints to point to your deployed backend URL.

## Areas of Focus & Craftsmanship

### 1. **Robust LLM Integration with Structured Output**
I paid close attention to creating a reliable, type-safe extraction pipeline using LangChain and Pydantic. The system uses structured output parsing to ensure consistent data extraction, with proper error handling and fallbacks. The prompt engineering was carefully crafted to extract only explicitly mentioned information, reducing the risk of hallucinations.

### 2. **User Experience & Interface Design**
The UI was designed with a focus on clarity and usability. Features include:
- Clean, modern gradient design that's easy on the eyes
- Expandable trial cards to reduce information overload
- Color-coded status badges for quick trial status identification
- Responsive design that works on mobile and desktop
- Loading states and error messages for better user feedback
- Sample transcript feature for quick testing

### 3. **API Integration & Error Handling**
The ClinicalTrials.gov API integration includes:
- Robust query parameter building based on extracted patient data
- Proper handling of API rate limits and timeouts
- Data transformation to present only relevant information
- Fallback mechanisms if the API is unavailable
- Efficient data extraction from nested API responses

## Future Enhancements

- **Trial Ranking**: Use AI to rank trials by relevance to the patient's specific condition
- **Patient Profile Saving**: Allow users to save patient profiles for future reference
- **Trial Comparison**: Side-by-side comparison of multiple trials
- **AI Q&A**: Chat interface to ask questions about specific trials
- **Email Notifications**: Notify patients when new relevant trials become available
- **Advanced Filtering**: Filter by location, phase, study type, etc.

## License

This project is created for the DeepScribe Product Engineer Coding Challenge.

## Contact

For questions or issues, please open an issue in the repository.
