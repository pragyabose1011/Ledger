"""RAG API endpoints for querying meeting history."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.rag import (
    index_all_transcripts,
    index_transcript,
    delete_meeting_chunks,
    clear_all_chunks,
    query_rag,
    search_chunks,
    get_stats,
    health_check,
    is_rag_available,
    OLLAMA_MODEL,
)

router = APIRouter(prefix="/rag", tags=["rag"])


# ============================================================================
# Request/Response Models
# ============================================================================

class RAGQuery(BaseModel):
    query: str  # Frontend sends "query", not "question"
    top_k: Optional[int] = 5
    meeting_id: Optional[int] = None
    use_local_llm: Optional[bool] = True


class RAGSource(BaseModel):
    meeting_title: str
    meeting_id: str
    excerpt: str
    score: float


class RAGResponse(BaseModel):
    answer: str
    sources: List[RAGSource] = []
    model: str = ""


class RAGIndexResponse(BaseModel):
    status: str
    indexed_meetings: int
    skipped_meetings: Optional[int] = 0
    failed_meetings: Optional[int] = 0
    total_chunks: int
    total_meetings: int
    errors: Optional[List[str]] = None


class RAGStatsResponse(BaseModel):
    total_chunks: int
    total_meetings: int
    indexed: bool


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/index-all")
def index_all(db: Session = Depends(get_db)):
    """Index all meeting transcripts for RAG."""
    try:
        result = index_all_transcripts(db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")


@router.post("/index/{meeting_id}")
def index_meeting(meeting_id: int, db: Session = Depends(get_db)):
    """Index a specific meeting's transcript."""
    from app.db.models.meeting import Meeting

    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    transcript = meeting.transcript or ""
    if not transcript.strip():
        raise HTTPException(status_code=400, detail="Meeting has no transcript")

    try:
        count = index_transcript(
            meeting.id,
            transcript,
            meeting_title=meeting.title or "",
        )
        return {"meeting_id": meeting_id, "chunks_indexed": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")


@router.post("/query", response_model=RAGResponse)
def rag_query(payload: RAGQuery):
    """Query meeting history using RAG."""
    if not is_rag_available():
        raise HTTPException(
            status_code=503,
            detail="RAG is not available. Install sentence-transformers and chromadb.",
        )
    try:
        # 1. Search for relevant chunks
        search_results = search_chunks(
            payload.query,
            top_k=payload.top_k,
            meeting_id=payload.meeting_id,
        )

        # 2. Build sources for the frontend
        sources = []
        for result in search_results:
            meta = result.get("metadata", {})
            sources.append(RAGSource(
                meeting_title=meta.get("meeting_title", "Unknown Meeting"),
                meeting_id=meta.get("meeting_id", ""),
                excerpt=result.get("document", "")[:200],  # First 200 chars
                score=result.get("similarity", 0.0),
            ))

        # 3. Generate answer
        answer = query_rag(
            payload.query,
            top_k=payload.top_k,
            meeting_id=payload.meeting_id,
        )

        return RAGResponse(
            answer=answer,
            sources=sources,
            model=f"ollama/{OLLAMA_MODEL}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG query failed: {str(e)}")


@router.delete("/meeting/{meeting_id}")
def delete_meeting_index(meeting_id: int):
    """Delete indexed chunks for a specific meeting."""
    try:
        count = delete_meeting_chunks(meeting_id)
        return {"meeting_id": meeting_id, "chunks_deleted": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")


@router.delete("/clear")
def clear_index():
    """Clear all indexed chunks."""
    try:
        count = clear_all_chunks()
        return {"chunks_deleted": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clear failed: {str(e)}")


@router.get("/stats")
def rag_stats(db: Session = Depends(get_db)):
    """Get RAG index statistics — returns format expected by frontend."""
    from app.db.models.meeting import Meeting

    raw_stats = get_stats()
    total_meetings = 0
    try:
        total_meetings = db.query(Meeting).count()
    except Exception:
        pass

    total_chunks = raw_stats.get("total_chunks", 0)

    return {
        "total_chunks": total_chunks,
        "total_meetings": total_meetings,
        "indexed": total_chunks > 0,
    }


@router.get("/health")
def rag_health():
    """Check health of RAG components."""
    return health_check()