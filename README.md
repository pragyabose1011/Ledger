# Ledger — Meeting Intelligence Platform

> Turn every meeting into a structured accountability record. Paste a transcript, upload a recording, or run your meeting inside Ledger — and get decisions, action items, risks, and a productivity score in under 30 seconds.

---

## Table of Contents

1. [What It Does](#what-it-does)
2. [Screenshots](#screenshots)
3. [System Architecture](#system-architecture)
4. [Data Model](#data-model)
5. [Backend Services & Workers](#backend-services--workers)
6. [API Reference](#api-reference)
7. [Data Flow](#data-flow)
8. [Frontend Architecture](#frontend-architecture)
9. [Deployment](#deployment)
10. [Environment Variables](#environment-variables)
11. [Tech Stack](#tech-stack)
12. [Running Locally](#running-locally)
13. [Security](#security)

---

## What It Does

Ledger solves a specific problem: meetings generate agreements and commitments that disappear the moment the call ends. Ledger captures those commitments and holds people accountable to them.

| Capability | How it works |
|---|---|
| **AI extraction** | LLM reads transcript, outputs structured decisions, action items, and risks with owner names and confidence scores |
| **Live meeting room** | WebRTC peer-to-peer video/audio with in-browser transcription — transcript saved and auto-extracted on end |
| **RAG (Ask AI)** | Semantic search across all your meetings using vector embeddings; answer questions in plain English |
| **Alerts** | Automatic detection of unowned items, overdue tasks, unacknowledged assignments, and recurring risks |
| **Metrics** | Per-meeting productivity score and 4-week trend dashboard |
| **Integrations** | Import Zoom cloud recordings (audio or transcript); OAuth login via Google, Zoom, Microsoft, Slack |
| **Notifications** | HTML email for assignments, reminders, and weekly digests |
| **Export** | Branded PDF export of any meeting |
| **Billing** | Stripe subscription (Free / Pro) |

---

## Screenshots

| Home | Dashboard |
|------|-----------|
| ![Home](docs/screenshots/homepage.png) | ![Dashboard](docs/screenshots/dashboard.png) |

| Meetings | Ask AI |
|----------|--------|
| ![Meetings](docs/screenshots/meetings.png) | ![Ask AI](docs/screenshots/askai.png) |

| Calendar | Integrations |
|----------|-------------|
| ![Calendar](docs/screenshots/calendar.png) | ![Integrations](docs/screenshots/integrations.png) |

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                             │
│                                                                      │
│   React 19 + TypeScript + Tailwind CSS + React Router v7             │
│   Axios HTTP · WebSocket (chat, signaling) · WebRTC (video/audio)    │
│   Web Speech API (live captions) · MediaRecorder (audio capture)     │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ HTTP / WS
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  NGINX (Reverse Proxy + Static Server)               │
│                                                                      │
│   / → serve React SPA (index.html fallback)                          │
│   /api/* → proxy to backend:8000                                     │
│   /ws/*  → WebSocket proxy (upgrade headers)                         │
│   Static assets cached 1 year (immutable)                            │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│              BACKEND  (FastAPI + Uvicorn, 2 Gunicorn workers)        │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  API Layer  (23 routers)                                    │    │
│  │  auth · meetings · transcripts · extract · decisions        │    │
│  │  action-items · risks · alerts · notifications · metrics    │    │
│  │  rag · live · rooms (WebRTC) · chat (WS) · upload           │    │
│  │  integrations · oauth · profile · colleagues · billing      │    │
│  │  export · messages                                          │    │
│  └───────────────────┬─────────────────────────────────────────┘    │
│                      │                                               │
│  ┌───────────────────▼─────────────────────────────────────────┐    │
│  │  Service Layer                                              │    │
│  │  openai_client   → selects OpenAI or Ollama                 │    │
│  │  ai_extractor    → prompt + JSON schema + confidence        │    │
│  │  rag             → chunk · embed · store · retrieve         │    │
│  │  transcription   → Whisper API or local whisper             │    │
│  │  email_notifier  → HTML templates, SMTP dispatch            │    │
│  │  zoom            → OAuth, recording list/download           │    │
│  └───────────────────┬─────────────────────────────────────────┘    │
│                      │                                               │
│  ┌───────────────────▼─────────────────────────────────────────┐    │
│  │  Worker Layer  (called synchronously, designed for async)   │    │
│  │  extract_from_transcript → idempotent extraction pipeline   │    │
│  │  alert_engine            → post-extraction alert detection  │    │
│  └─────────────────────────────────────────────────────────────┘    │
└──────────┬────────────────────────────────────────────────┬─────────┘
           │                                                │
           ▼                                                ▼
┌─────────────────────────┐               ┌────────────────────────────┐
│      MySQL 8.0          │               │  ChromaDB  (vector store)  │
│                         │               │                            │
│  users                  │               │  Collection: meeting_chunks│
│  meetings               │               │  Embeddings: all-MiniLM-   │
│  transcripts            │               │             L6-v2 (384-dim)│
│  decisions              │               │  Distance:  cosine         │
│  action_items           │               │  Metadata:  meeting_id,    │
│  risks                  │               │             title, date    │
│  alerts                 │               │  Chunks:    500 words,     │
│  meeting_participants   │               │             50-word overlap│
│  colleagues             │               └────────────────────────────┘
│  messages               │
└─────────────────────────┘

                External Services
                ─────────────────
                OpenAI API     → gpt-4o-mini (extraction, live assist)
                               → whisper-1 (audio transcription)
                Ollama         → local LLM fallback (llama3, mistral, etc.)
                Stripe         → checkout, portal, webhooks
                Zoom API       → OAuth, recording list/download/transcript
                Google OAuth   → sign in with Google
                Microsoft OAuth→ sign in with Microsoft
                Slack OAuth    → sign in with Slack
                SMTP           → email notifications
```

---

## Data Model

```
users
├── id            UUID PK
├── name          VARCHAR(255)
├── email         VARCHAR(255) UNIQUE
├── role          VARCHAR(255)
├── password_hash VARCHAR(255)          # null for OAuth-only accounts
├── avatar_url    VARCHAR(500)
├── stripe_customer_id    VARCHAR(255)
├── stripe_subscription_id VARCHAR(255)
├── password_reset_token  VARCHAR(255)
├── password_reset_expires DATETIME
└── created_at    DATETIME

meetings
├── id            UUID PK
├── title         VARCHAR(500)
├── platform      VARCHAR(100)         # Zoom | Teams | Meet | Ledger | etc.
├── start_time    DATETIME
├── end_time      DATETIME
├── owner_id      UUID → users.id
└── created_at    DATETIME

transcripts
├── id            UUID PK
├── meeting_id    UUID → meetings.id   # effectively 1:1
├── content       TEXT                 # raw transcript
└── created_at    DATETIME

decisions
├── id            UUID PK
├── meeting_id    UUID → meetings.id
├── owner_id      UUID → users.id      # nullable
├── summary       TEXT
├── source_sentence TEXT               # excerpt from transcript
├── confidence    FLOAT                # 0.0–1.0, LLM self-reported
└── created_at    DATETIME

action_items
├── id            UUID PK
├── meeting_id    UUID → meetings.id
├── owner_id      UUID → users.id      # nullable
├── description   TEXT
├── status        VARCHAR(50)          # open | done
├── due_date      DATETIME
├── source_sentence TEXT
├── confidence    FLOAT
├── acknowledged_at DATETIME           # when owner first saw it
└── created_at    DATETIME

risks
├── id            UUID PK
├── meeting_id    UUID → meetings.id
├── description   TEXT
├── source_sentence TEXT
├── confidence    FLOAT
└── created_at    DATETIME

alerts
├── id            UUID PK
├── meeting_id    UUID → meetings.id
├── action_item_id UUID → action_items.id
├── type          VARCHAR(100)         # see Alert Types below
├── message       TEXT
└── created_at    DATETIME

meeting_participants
├── meeting_id    UUID → meetings.id   # composite PK
├── user_id       UUID → users.id      # composite PK
└── role          VARCHAR(100)         # presenter | attendee | organizer

colleagues
├── id            UUID PK
├── user_id       UUID → users.id ON DELETE CASCADE
├── colleague_id  UUID → users.id ON DELETE CASCADE
└── created_at    DATETIME             # UNIQUE(user_id, colleague_id)

messages
├── id            UUID PK
├── sender_id     UUID → users.id ON DELETE CASCADE
├── recipient_id  UUID → users.id ON DELETE CASCADE
├── content       TEXT
├── read_at       DATETIME
└── created_at    DATETIME
```

**Alert Types**

| Type | Trigger |
|------|---------|
| `no_owner` | Action item extracted with no owner |
| `decision_no_owner` | Decision extracted with no owner |
| `overdue` | Action item past due date and not done |
| `no_outcomes` | Meeting had no decisions and no actions |
| `never_acknowledged` | Action assigned 2+ days ago, never acknowledged |
| `repeated_issue` | Risk appeared in 2+ meetings in the last 30 days (≥3-word overlap) |

---

## Backend Services & Workers

### AI Extractor (`services/ai_extractor.py`)

Sends the transcript to an LLM with a structured prompt that instructs it to return a strict JSON schema:

```json
{
  "decisions":    [{ "summary", "owner", "source_sentence", "confidence" }],
  "action_items": [{ "description", "owner", "due_date", "source_sentence", "confidence" }],
  "risks":        [{ "description", "source_sentence", "confidence" }]
}
```

Priority: **OpenAI gpt-4o-mini** → **Ollama** (local fallback). The `USE_OLLAMA=true` env var skips OpenAI entirely.

---

### RAG Engine (`services/rag.py`)

Implements semantic search across all meeting transcripts.

**Indexing:**
1. Chunk transcript into 500-word windows with 50-word overlap
2. Embed each chunk with `sentence-transformers/all-MiniLM-L6-v2` (384-dim)
3. Upsert into ChromaDB collection `meeting_chunks` with metadata

**Querying:**
1. Embed the user's question
2. Cosine-similarity search in ChromaDB (`top_k=5`)
3. Build context string from retrieved chunks
4. Pass context + question to Ollama → return grounded answer

Auto-triggered after every extraction. Can also be triggered manually via `/rag/index-all`.

---

### Extraction Worker (`workers/extract_from_transcript.py`)

Idempotent pipeline — safe to re-run on the same transcript:

```
1. DELETE existing decisions, action_items, risks for meeting_id
2. Call extract_decisions_and_actions(llm, transcript.content)
3. For each result: match owner_name to existing User.name (no ghost accounts)
4. Save decisions / action items / risks with confidence + source_sentence
5. run_alerts_for_meeting(db, meeting_id)
6. detect_repeated_issues(db, meeting_id)
```

---

### Alert Engine (`workers/alert_engine.py`)

Runs after every extraction. Clears old alerts first (idempotent), then checks:

- Action items without an owner
- Decisions without an owner
- Action items that are overdue
- Meetings with zero outcomes
- Action items unacknowledged for 48+ hours
- Risks matching ≥3 words from any risk in the past 30 days of the user's meetings

---

### Transcription (`services/transcription.py`)

Accepts `.mp3 .mp4 .mpeg .mpga .m4a .wav .webm .ogg` up to 25 MB.
Tries **OpenAI Whisper API** first; falls back to **local whisper** if `use_local_whisper=true`.

---

### Email Notifier (`services/email_notifier.py`)

Four HTML-templated email types, all using SMTP with STARTTLS:

| Function | Trigger |
|----------|---------|
| `send_action_item_assigned` | Owner assigned via extraction |
| `send_action_item_reminder` | Overdue / due today / due in N days |
| `send_weekly_digest` | Stats + open items list |
| `send_meeting_summary` | Post-extraction summary to meeting owner |

All links resolve to `FRONTEND_URL` from env.

---

## API Reference

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/signup` | — | Register with email + password |
| POST | `/auth/login` | — | Returns JWT |
| GET | `/oauth/{provider}/login` | — | Redirect to OAuth consent screen |
| GET | `/oauth/{provider}/callback` | — | Exchange code → JWT, create user if new |
| POST | `/auth/forgot-password` | — | Send reset token |
| POST | `/auth/reset-password` | — | Consume token, set new password |

### Meetings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/meetings/` | ✓ | List — query params: `q` (search), `platform` |
| POST | `/meetings/` | ✓ | Create |
| GET | `/meetings/{id}` | ✓ | Full detail (transcript, decisions, actions, risks) |
| PUT | `/meetings/{id}` | ✓ | Update title/times |
| GET | `/meetings/calendar` | ✓ | `year`, `month` query params |
| POST | `/meetings/{id}/participants` | ✓ | Add participant |
| DELETE | `/meetings/{id}/participants/{uid}` | ✓ | Remove participant |

### Transcript & Upload

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/transcripts/` | ✓ | Paste raw transcript text |
| POST | `/upload/audio` | ✓ | Upload audio file → auto-transcribed (max 25 MB) |

### Extraction & Outcomes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/extract/` | — | Run AI extraction on a transcript |
| GET | `/alerts/{meeting_id}` | ✓ | Get alerts for a meeting |
| POST | `/action-items/{id}/acknowledge` | ✓ | Mark as seen |
| POST | `/action-items/{id}/done` | ✓ | Mark complete |
| POST | `/action-items/{id}/reopen` | ✓ | Reopen |

### RAG (Ask AI)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/rag/query` | — | Semantic Q&A across all meetings |
| GET | `/rag/stats` | ✓ | Index stats (chunks, meetings, health) |
| POST | `/rag/index-all` | — | Re-index all transcripts |
| DELETE | `/rag/clear` | — | Clear index |

### Live Meeting Room

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/rooms/create` | ✓ | Create room → returns 8-char `room_id` |
| GET | `/rooms/{room_id}` | ✓ | Room info + participant list |
| POST | `/rooms/{room_id}/end` | ✓ | Save transcript + trigger extraction |
| WS | `/ws/room/{room_id}?token=` | ✓ | WebRTC signaling (offer/answer/ICE/chat/reaction) |
| WS | `/ws/chat?token=` | ✓ | Real-time 1:1 messaging |

### Metrics & Export

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/metrics/dashboard` | ✓ | KPIs, weekly trend, recent alerts |
| GET | `/metrics/meeting/{id}` | ✓ | Per-meeting productivity score |
| GET | `/export/meeting/{id}/pdf` | ✓ | Download branded PDF |

### Integrations & Billing

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/integrations/zoom/status` | — | Is Zoom configured? |
| GET | `/integrations/zoom/recordings` | ✓ | List cloud recordings |
| POST | `/integrations/zoom/import` | ✓ | Import a recording |
| GET | `/billing/status` | ✓ | Free or Pro |
| POST | `/billing/create-checkout-session` | ✓ | Start Stripe checkout |
| POST | `/billing/portal` | ✓ | Stripe customer portal |
| POST | `/billing/webhook` | — | Stripe event handler |

---

## Data Flow

### Transcript → Outcomes

```
User pastes transcript / uploads audio
          │
          ▼
POST /transcripts  or  POST /upload/audio → Whisper transcription
          │
          ▼
POST /extract
          │
          ├─► Delete old decisions/actions/risks (idempotent)
          │
          ├─► LLM (gpt-4o-mini or Ollama)
          │       Returns JSON: decisions[], action_items[], risks[]
          │       Each item has: owner, source_sentence, confidence
          │
          ├─► Owner matching: User.name lookup (no ghost accounts)
          │
          ├─► Save to DB
          │
          ├─► Alert engine
          │       no_owner, overdue, no_outcomes, unacknowledged,
          │       decision_no_owner, repeated_issue
          │
          ├─► RAG indexing (async, best-effort)
          │       Chunk → embed → upsert ChromaDB
          │
          └─► Email notifications (async, best-effort)
```

### Semantic Q&A (RAG)

```
User: "What did we decide about the API redesign?"
          │
          ▼
POST /rag/query
          │
          ├─► Embed question (all-MiniLM-L6-v2, 384-dim)
          │
          ├─► ChromaDB cosine search → top 5 chunks
          │       Each chunk: text excerpt + {meeting_id, title, date}
          │
          ├─► Build context string
          │
          └─► Ollama generates grounded answer
                  Returns: { answer, sources[] }
```

### Live Meeting Room (WebRTC)

```
User A clicks "Start Meeting" → names meeting
          │
          ▼
POST /rooms/create → room_id (8-char)
          │
          ▼
Browser opens /room/{room_id}
          │
          ├─► WS connect: /ws/room/{room_id}?token=
          │
          ├─► Peer joins → receive peer_joined (should_offer: true/false)
          │       → RTCPeerConnection offer/answer via WS signaling
          │       → ICE candidates exchanged
          │       → P2P audio/video established (STUN: Google)
          │
          ├─► Web Speech API running in browser
          │       Real-time captions displayed on screen
          │       Transcript accumulated in memory
          │
          └─► User clicks "End Call"
                  │
                  ▼
                POST /rooms/{room_id}/end
                  { title, transcript, participants[], start_time, end_time }
                  │
                  ▼
                Create Meeting + Transcript records
                  │
                  ▼
                Run extraction pipeline (async)
                  │
                  ▼
                Navigate to /meetings/{id}
```

### Alert Generation

```
After extraction:
  run_alerts_for_meeting(meeting_id)
    │
    ├─► Check each action item: no owner? → alert
    ├─► Check each action item: past due? → alert
    ├─► Check each decision: no owner? → alert
    ├─► No decisions AND no actions? → alert
    ├─► Action assigned 48h+ ago, not acknowledged? → alert
    │
    └─► detect_repeated_issues(meeting_id)
          │
          ├─► Get current risks
          ├─► Query past 30 days of user's meetings
          └─► Word overlap ≥3 with any past risk → repeated_issue alert
```

---

## Frontend Architecture

Built with **React 19**, **TypeScript**, **React Router v7**, and **Tailwind CSS**. The entire app is a single-page application served by nginx; all routing is client-side.

### Route Map

```
/                    → Home (landing, pricing)
/login               → Email/OAuth login
/signup              → Registration
/forgot-password     → Password reset request
/reset-password      → Password reset confirm
/oauth-callback      → Extract JWT from URL, redirect
/meetings            → Meeting list + search + filters
/meetings/:id        → Full detail: transcript, outcomes, participants, export
/dashboard           → KPI cards, 4-week trend chart, recent alerts
/calendar            → Monthly calendar view grouped by meeting
/chat                → Real-time 1:1 messaging
/integrations        → Zoom/Teams/Meet config + Zoom import UI
/profile             → Avatar, name, password, billing
/demo                → Pre-populated example meeting
/room/:roomId        → Live WebRTC meeting room
```

### State Management

No external state library — local `useState` / `useEffect` per page, JWT in `localStorage`, Axios instance with auth header injected from `lib/api.ts`.

### Real-time

| Feature | Protocol | Notes |
|---------|----------|-------|
| 1:1 chat | WebSocket `/ws/chat` | ConnectionManager in-memory on server |
| Meeting room signaling | WebSocket `/ws/room/{id}` | Offer/answer/ICE, chat, reactions, media state |
| WebRTC audio/video | P2P (browser↔browser) | Google STUN servers; no media relay (TURN) |
| Live captions | Web Speech API | Runs entirely in browser, no server round-trip |

### Theming

Dark mode (default) and light mode toggled by `.light` class on `<html>`. All Tailwind `slate-*` values have explicit light-mode overrides in `index.css`. Accent color: `ledger-pink` (`#e485b6`).

---

## Deployment

### Docker Compose (recommended)

```bash
git clone https://github.com/pragyabose1011/Ledger.git
cd Ledger

cp backend/.env.example backend/.env
# Edit backend/.env — set SECRET_KEY and OPENAI_API_KEY at minimum

docker compose up --build
```

- App: `http://localhost`
- API docs: `http://localhost:8000/docs`

**Services:**

| Container | Image | Port | Volumes |
|-----------|-------|------|---------|
| `ledger-db` | mysql:8.0 | internal | `mysql-data` |
| `ledger-backend` | custom (python:3.11-slim) | 8000 | `chroma-data`, `uploads-data`, `model-cache` |
| `ledger-frontend` | custom (nginx:alpine) | 80 | — |

`mysql-data`, `chroma-data`, and `uploads-data` are Docker named volumes — data persists across restarts. Only rebuild the backend after backend changes:

```bash
docker compose up --build backend -d
```

### Without Docker

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

MySQL must be running separately. Set `DATABASE_URL` in `backend/.env`.

---

## Environment Variables

Create `backend/.env`:

```env
# ── Required ────────────────────────────────────────────
JWT_SECRET_KEY=<long-random-string>
DATABASE_URL=mysql+pymysql://ledger:ledgerpass@localhost:3306/ledger

# ── AI — pick one ────────────────────────────────────────
OPENAI_API_KEY=sk-...
# OR
USE_OLLAMA=true
OLLAMA_MODEL=llama3.2
OLLAMA_BASE_URL=http://localhost:11434

# ── Frontend URL (controls OAuth redirects + email links) ─
FRONTEND_URL=http://localhost

# ── OAuth providers (all optional) ───────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_ACCOUNT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=

# ── Email (optional) ─────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=Ledger

# ── Stripe (optional) ────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ── Advanced ─────────────────────────────────────────────
EXTRA_CORS_ORIGINS=https://your-domain.com   # comma-separated additional origins
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | React | 19 |
| Language | TypeScript | 5.9 |
| Styling | Tailwind CSS | 3.4 |
| Routing | React Router | 7 |
| HTTP client | Axios | 1.13 |
| Build tool | Vite | 7 |
| Backend framework | FastAPI | 0.104 |
| ASGI server | Uvicorn / Gunicorn | — |
| ORM | SQLAlchemy | 2.0 |
| Database | MySQL | 8.0 |
| Auth | JWT (python-jose) + OAuth2 | HS256 / 7-day |
| Password hashing | passlib (pbkdf2_sha256) | — |
| LLM | OpenAI gpt-4o-mini / Ollama | — |
| Transcription | OpenAI Whisper / local whisper | — |
| Vector store | ChromaDB | 0.4 |
| Embeddings | sentence-transformers all-MiniLM-L6-v2 | 384-dim |
| PDF generation | ReportLab | 4 |
| Payments | Stripe | 7 |
| WebRTC signaling | FastAPI WebSocket | — |
| Live captions | Web Speech API | browser native |
| Proxy | nginx | alpine |
| Container orchestration | Docker Compose | 3.8 |

---

## Security

| Area | Implementation |
|------|---------------|
| Password policy | 8+ chars, uppercase, lowercase, digit, special char enforced server-side |
| Disposable email blocking | 20+ known throwaway domains rejected at signup |
| JWT | HS256, 7-day expiry, warning logged if default dev secret is used |
| CORS | Configurable via `FRONTEND_URL` + `EXTRA_CORS_ORIGINS`; defaults to localhost only |
| SQL injection | Not possible — all queries via SQLAlchemy ORM |
| File upload | Extension allowlist, 25 MB size cap, saved with UUID filenames |
| OAuth | Minimal scopes; tokens not stored in DB (used only to create/find user) |
| Stripe webhooks | Signature verification (`stripe.Webhook.construct_event`) before processing |
| Data isolation | All metrics, meetings, and action items filtered by `owner_id = current_user.id` |
| Ownership enforcement | Action item mutations verify parent meeting belongs to current user |

---

## License

MIT
