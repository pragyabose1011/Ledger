# Ledger — AI-Native Meeting Intelligence Platform

Ledger is an **AI-native meeting intelligence platform** that converts unstructured meeting conversations into **structured, persistent, and actionable business outcomes**.

It captures meeting metadata and transcripts, applies **large language models (LLMs)** to extract **decisions and action items**, and stores them in a **scalable system of record** designed for productivity analytics, accountability, and workflow automation.

Ledger is architected as a **distributed, service-oriented system**, not a chatbot or UI-only application.

---

## Key Highlights 

* AI-powered information extraction using LLMs
* RESTful APIs built with FastAPI
* Modular backend architecture with service and worker layers
* SQL-based relational data modeling (SQLAlchemy ORM)
* Fault-tolerant AI integration with graceful degradation
* OpenAPI / Swagger-driven API documentation
* Designed for scalability, extensibility, and production hardening

---

## Problem Statement

Meetings generate critical business decisions and commitments, but these outcomes are often:

* undocumented
* scattered across tools
* difficult to track or audit

Ledger addresses this gap by acting as a **canonical intelligence layer** that reliably transforms conversational data into **structured, queryable artifacts**.

---

## System Capabilities

### 1. Data Ingestion Layer

* Meeting creation and participant management
* Transcript ingestion via REST APIs
* Decoupled capture mechanism (SDK-ready architecture)

### 2. AI Intelligence Layer

* LLM-driven extraction of:

  * decisions
  * action items
* Structured JSON output for downstream processing
* Provider-agnostic design (OpenAI + fallback engine)

### 3. Persistence & Data Modeling

* Normalized relational schema
* Entities include:

  * meetings
  * participants
  * transcripts
  * decisions
  * action items
* Designed for traceability, accountability, and analytics

### 4. Reliability & Error Handling

* External AI treated as an unreliable dependency
* Call-time exception handling
* Automatic deterministic fallback logic
* No system-wide failures due to AI quota, auth, or network issues

---

## High-Level Architecture

```
Client (Swagger / cURL / Future UI)
        |
        v
API Layer (FastAPI Routers)
        |
        v
Service Layer (AI Extraction)
        |
        v
LLM Provider (OpenAI / Fallback)
        |
        v
Persistence Layer (SQLAlchemy ORM)
```

**Design principles:**

* separation of concerns
* fail-safe AI integration
* extensibility over tight coupling

---

## Project Structure

```
backend/
├── app/
│   ├── api/            # REST API routers
│   ├── db/             # ORM models and DB session
│   ├── services/       # AI and business logic
│   ├── workers/        # Background-style processing
│   └── main.py         # Application entrypoint
├── requirements.txt
└── Dockerfile
```

---

## API Overview

### Meetings API

* `POST /meetings`

  * Create meetings with participant metadata

### Transcripts API

* `POST /transcripts`

  * Store raw meeting transcripts

### AI Extraction API

* `POST /extract`

  * Trigger AI-based extraction pipeline

Interactive documentation available via **Swagger UI**:

```
http://127.0.0.1:8000/docs
```

---

## AI Processing Pipeline

1. Transcript fetched from relational database
2. Text passed to AI extraction service
3. LLM returns structured JSON:

   * decisions
   * action items
4. Results persisted transactionally
5. On AI failure:

   * fallback extraction used
   * API returns success
   * system state remains consistent

---

## Fault Tolerance Strategy

Ledger implements **defensive AI integration**:

* AI calls wrapped in exception handling
* Quota, authentication, and provider failures handled gracefully
* Deterministic fallback ensures:

  * system availability
  * demo reliability
  * production safety

This approach mirrors real-world **resilient distributed systems**.

---

## Technology Stack

* **Backend:** FastAPI
* **ORM:** SQLAlchemy
* **Database:** SQLite (development)
* **AI / NLP:** OpenAI API (pluggable)
* **API Spec:** OpenAPI / Swagger
* **Language:** Python 3.9+

---

## Local Development

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Optional AI integration:

```bash
export OPENAI_API_KEY=sk-...
```

---

## Scalability & Future Enhancements

* Asynchronous background processing (Celery / Redis)
* Idempotent extraction & versioning
* Confidence scoring and explainability
* PostgreSQL migration
* Frontend dashboard (React)
* SDKs for capture (desktop, browser, calendar)

---

## Why This Project Matters

Ledger demonstrates:

* system design thinking
* production-grade backend engineering
* responsible AI integration
* scalable data modeling
* reliability-first architecture

It is designed to evolve into a **core intelligence component** within productivity and enterprise workflow platforms.

