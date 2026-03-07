# Copilot Instructions for Ledger

## Overview
Ledger is an AI-native meeting intelligence platform that transforms unstructured meeting conversations into structured, actionable business outcomes. The system is architected as a distributed, service-oriented backend (FastAPI, SQLAlchemy, Python) and a modular frontend (React, TypeScript, Vite).

## Architecture & Key Components
- **Backend (backend/app):**
  - `api/`: FastAPI routers for REST endpoints (meetings, transcripts, extraction, integrations)
  - `db/`: SQLAlchemy ORM models, session management
  - `services/`: AI extraction, integrations, business logic
  - `workers/`: Background processing (alerting, extraction, notifications)
  - `main.py`: Application entrypoint
- **Frontend (frontend/src):**
  - `pages/`: React pages (Meetings, Calendar, Integrations, etc.)
  - `lib/api.ts`: API utilities for backend communication

## Data Flow & AI Integration
- Meeting and transcript data ingested via REST APIs
- AI extraction (LLM, RAG) triggered by `/extract` endpoint or background workers
- Results (decisions, action items) persisted in normalized relational schema
- Defensive AI integration: All AI calls are wrapped in exception handling; fallback logic ensures reliability

## Developer Workflows
- **Backend:**
  - Create venv: `python3 -m venv venv && source venv/bin/activate`
  - Install deps: `pip install -r requirements.txt`
  - Start server: `uvicorn app.main:app --reload`
  - AI integration: `export OPENAI_API_KEY=...` and/or `export USE_OLLAMA=true && ollama serve`
- **Frontend:**
  - Install deps: `npm install`
  - Start dev server: `npm run dev`

## Project-Specific Patterns
- All AI extraction is provider-agnostic (OpenAI, Ollama, fallback)
- API endpoints return structured JSON for downstream processing
- Exception handling and fallback logic are mandatory for AI calls
- Integrations (Zoom, Teams, Google Meet) managed via `.env` and frontend Integrations page
- Background workers handle asynchronous tasks (alerts, notifications, extraction)

## Critical Files & Directories
- `backend/app/api/`: REST API definitions
- `backend/app/services/`: AI and business logic
- `backend/app/db/models/`: Data models
- `frontend/src/pages/`: UI pages
- `frontend/src/lib/api.ts`: API client

## Example Patterns
- To add a new AI extraction provider, implement in `services/ai_extractor.py` and update fallback logic
- To extend meeting data, update `db/models/meeting.py` and corresponding API/router
- To add a new integration, create service in `services/`, API router in `api/`, and UI in `frontend/src/pages/Integrations.tsx`

## Conventions
- Use OpenAPI/Swagger for API documentation (`/docs` endpoint)
- Defensive programming for all external dependencies
- Modular, extensible service and worker layers
- SQLAlchemy for all persistence
- React + TypeScript + Tailwind for frontend

---

For questions or unclear patterns, review `README.md` or contact the maintainer.
