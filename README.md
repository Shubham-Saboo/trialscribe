# TrialScribe - AI-Powered Clinical Trial Matcher

**Live Demo:** [https://trialscribe-frontend-z2qrei6gjq-uc.a.run.app](https://trialscribe-frontend-z2qrei6gjq-uc.a.run.app)

TrialScribe automatically extracts patient information from doctor-patient transcripts and matches them with relevant clinical trials from ClinicalTrials.gov using AI.

## 🎯 Approach

**Three-Stage Pipeline:**
1. **AI Extraction** → LangChain + GPT-4o-mini extracts structured patient data (diagnosis, demographics, symptoms, location)
2. **Smart Query Building** → Constructs optimized ClinicalTrials.gov API queries with progressive filtering
3. **Intelligent Matching** → Returns relevant, currently recruiting trials with detailed eligibility criteria

**Tech Stack:** Flask (Python) + React (TypeScript) + LangChain + OpenAI API + ClinicalTrials.gov API v2

## 🚀 Quick Start with Docker

### Prerequisites
- [Docker](https://www.docker.com/get-started) installed
- [OpenAI API Key](https://platform.openai.com/api-keys)

### Setup & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/trialscribe.git
   cd trialscribe
   ```

2. **Create environment file:**
   ```bash
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
   ```

3. **Start the application:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - **Frontend:** http://localhost
   - **Backend API:** http://localhost:5001

That's it! The application is now running. Visit `http://localhost` and use the sample transcript to test it.

### Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop the application
docker-compose stop

# Stop and remove containers
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

## 📋 Key Assumptions

1. **GPT-4o-mini** provides sufficient accuracy for medical extraction (cost-effective)
2. **Only explicit information** is extracted (prevents hallucinations)
3. **Recruiting/Not Yet Recruiting** trials are most relevant (default filter)
4. **Most specific location** yields better results (ZIP > City > State > Country)
5. **Progressive filtering** balances comprehensiveness with relevance (>50 results triggers additional filters)
6. **Graceful error handling** provides better UX than technical errors
7. **Search refinement** allows iterative improvement without re-entering transcripts

## 🏗️ Architecture

```
Backend (Flask) → LangChain → OpenAI API → Extract Patient Data
                                      ↓
                              ClinicalTrials.gov API → Match Trials
                                      ↓
Frontend (React) ← Display Results ← Backend API
```

## ✨ Features I'm proud of:

- 🔍 Advanced query building with Essie expression syntax
- 💬 AI chatbot for individual trial Q&A
- ⭐ Favorites management
- 🔧 Search parameter refinement

## 🔗 Links

- **Live Demo:** [Frontend](https://trialscribe-frontend-z2qrei6gjq-uc.a.run.app) | [Backend Health](https://trialscribe-backend-urywxjb4aa-uc.a.run.app/health)
- **Deployment:** Google Cloud Run (serverless containers)
- **APIs:** OpenAI GPT-4o-mini, ClinicalTrials.gov API v2
