# Quick Start Guide

## Backend Setup (Terminal 1)

```bash
# Install uv if needed: curl -LsSf https://astral.sh/uv/install.sh | sh
cd backend
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -r requirements.txt
cp env.example .env
# Edit .env and add your OPENAI_API_KEY
python app.py
```

Backend will run on http://localhost:5001

## Frontend Setup (Terminal 2)

```bash
cd frontend
npm install
npm start
```

Frontend will run on http://localhost:3000

## Testing

1. Open http://localhost:3000 in your browser
2. Click "Use Sample Transcript" to load a sample conversation
3. Click "Find Clinical Trials"
4. Review the extracted patient data and matching clinical trials

