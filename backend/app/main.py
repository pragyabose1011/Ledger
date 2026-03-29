from dotenv import load_dotenv
import os
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.db.session import SessionLocal
from app.api.meetings import router as meetings_router
from app.api.decisions import router as decisions_router
from app.api.action_items import router as action_items_router
from app.api.transcripts import router as transcripts_router
from app.api.extract import router as extract_router
from app.api.alerts import router as alerts_router
from app.api.metrics import router as metrics_router
from app.api.auth import router as auth_router
from app.api.notifications import router as notifications_router
from app.api.export import router as export_router
from app.api.oauth import router as oauth_router
from app.api.rag import router as rag_router
from app.api.upload import router as upload_router
from app.api.integrations import router as integrations_router
from app.api.profile import router as profile_router
from app.api.colleagues import router as colleagues_router
from app.api.chat import router as chat_router
from app.api.billing import router as billing_router
from app.api.live import router as live_router

app = FastAPI(title="Ledger API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://localhost",
        "http://localhost:80",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
USE_OLLAMA = os.getenv("USE_OLLAMA", "false").lower() == "true"

if not OPENAI_API_KEY and not USE_OLLAMA:
    import logging
    logging.warning(
        "No LLM configured: set OPENAI_API_KEY or USE_OLLAMA=true. "
        "AI extraction and live assist features will be unavailable."
    )

# Serve uploaded files (avatars, etc.)
os.makedirs("uploads/avatars", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(transcripts_router)
app.include_router(meetings_router)
app.include_router(decisions_router)
app.include_router(action_items_router)
app.include_router(extract_router)
app.include_router(alerts_router)
app.include_router(metrics_router)
app.include_router(auth_router)
app.include_router(notifications_router)
app.include_router(export_router)
app.include_router(oauth_router)
app.include_router(rag_router)
app.include_router(upload_router)
app.include_router(integrations_router)
app.include_router(profile_router)
app.include_router(colleagues_router)
app.include_router(chat_router)
app.include_router(billing_router)
app.include_router(live_router)


@app.get("/")
async def root():
    return {"message": "Welcome to Ledger API"}


@app.get("/health")
async def health():
    return {"status": "ok"}
