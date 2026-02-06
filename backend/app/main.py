from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import SessionLocal  # triggers model imports
from app.api.meetings import router as meetings_router
from app.api.decisions import router as decisions_router
from app.api.action_items import router as action_items_router
from app.api.transcripts import router as transcripts_router
from app.api.extract import router as extract_router
from app.api.alerts import router as alerts_router
from app.api.metrics import router as metrics_router


# -------------------------
# Create app FIRST
# -------------------------
app = FastAPI(title="Ledger API", version="0.1.0")

# -------------------------
# Middleware
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Routers
# -------------------------
app.include_router(transcripts_router)
app.include_router(meetings_router)
app.include_router(decisions_router)
app.include_router(action_items_router)
app.include_router(extract_router)
app.include_router(alerts_router) 
app.include_router(metrics_router)

# -------------------------
# Health & root
# -------------------------
@app.get("/")
async def root():
    return {"message": "Welcome to Ledger API"}

@app.get("/health")
async def health():
    return {"status": "ok"}
