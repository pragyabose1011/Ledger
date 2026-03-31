# Ledger — Meeting Intelligence Platform

Ledger turns any meeting into a structured accountability record. Paste a transcript, upload a recording, or run your meeting directly inside Ledger — and get decisions, action items, risks, and a productivity score in under 30 seconds.

## Screenshots

### Home
![Home page](docs/screenshots/homepage.png)

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Meetings
![Meetings](docs/screenshots/meetings.png)

### Ask AI
![Ask AI](docs/screenshots/askai.png)

### Calendar
![Calendar](docs/screenshots/calendar.png)

### Integrations
![Integrations](docs/screenshots/integrations.png)

---

## What it does

- **Extracts** decisions, action items, and risks from any transcript using LLMs (OpenAI or local Ollama)
- **Scores** meeting productivity and tracks trends over time
- **Alerts** when tasks have no owner, deadlines pass, or the same issue keeps coming up
- **Built-in meeting room** — video, audio, screen share, chat, emoji reactions, live transcription, and auto-extraction when the meeting ends
- **Ask AI** — query your entire meeting history in plain English using RAG
- **PDF export** and email summaries
- **OAuth** — sign in with Google, Zoom, Microsoft, or Slack

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + SQLAlchemy + MySQL |
| Frontend | React + TypeScript + Tailwind CSS |
| AI | OpenAI API / Ollama (local) |
| RAG | ChromaDB + sentence-transformers |
| Transcription | OpenAI Whisper / local Whisper |
| Meeting room | WebRTC (browser peer-to-peer) + Web Speech API |
| Auth | JWT + OAuth2 (Google, Zoom, Microsoft, Slack) |
| Deploy | Docker Compose + nginx |

---

## Running locally with Docker

```bash
git clone https://github.com/pragyabose1011/Ledger.git
cd Ledger

# Add your env vars
cp backend/.env.example backend/.env
# edit backend/.env — set SECRET_KEY, OPENAI_API_KEY at minimum

docker compose up --build
```

App is at `http://localhost`. API docs at `http://localhost:8000/docs`.

---

## Running locally without Docker

**Backend**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## Environment variables

Create `backend/.env`:

```env
# Required
SECRET_KEY=your-secret-key-here
DATABASE_URL=mysql+pymysql://ledger:ledgerpass@localhost:3306/ledger

# AI — pick one
OPENAI_API_KEY=sk-...
# OR
USE_OLLAMA=true
OLLAMA_MODEL=llama3.2
OLLAMA_BASE_URL=http://localhost:11434

# Optional — OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=

# Optional — Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# Optional — Billing
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=

# Optional — Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost
```

---

## Key API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/signup` | Register |
| `POST` | `/auth/login` | Login |
| `POST` | `/meetings` | Create meeting |
| `POST` | `/transcripts` | Add transcript |
| `POST` | `/extract` | Run AI extraction |
| `POST` | `/upload/audio` | Upload audio for transcription |
| `POST` | `/rag/query` | Ask a question across all meetings |
| `POST` | `/rooms/create` | Create a live meeting room |
| `POST` | `/rooms/{id}/end` | End room, save transcript, trigger extraction |
| `WS`   | `/ws/room/{id}` | WebRTC signaling WebSocket |
| `WS`   | `/ws/chat` | Real-time messaging WebSocket |

Full interactive docs: `http://localhost:8000/docs`

---

## Project structure

```
backend/
├── app/
│   ├── api/            # FastAPI routers (meetings, extract, auth, rooms, rag, …)
│   ├── db/
│   │   └── models/     # SQLAlchemy models
│   ├── services/       # AI extraction, RAG, transcription, email, Zoom
│   ├── workers/        # Extraction pipeline, alert engine
│   └── main.py
├── requirements.txt
└── Dockerfile

frontend/
├── src/
│   ├── pages/          # Login, Meetings, Dashboard, Calendar, Room, Demo, …
│   ├── components/     # Layout, shared UI
│   ├── lib/            # Axios API client
│   └── App.tsx
├── nginx.conf
└── Dockerfile
```

---

## License

MIT
