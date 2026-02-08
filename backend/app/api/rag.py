"""RAG API endpoints for querying meeting history."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.user import User
from app.db.models.meeting import Meeting
from app.db.models.transcript import Transcript
from app.api.auth import get_current_user
from app.services.rag import (
    query_meetings,
    index_meeting,
    search_meetings,
    get_index_stats,
)

router = APIRouter(prefix="/rag", tags=["rag"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5
    use_local_llm: Optional[bool] = False
    local_model: Optional[str] = "llama3.1:8b"


class QueryResponse(BaseModel):
    answer: str
    sources: List[dict]
    model: str


class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5


class IndexRequest(BaseModel):
    meeting_id: str


@router.post("/query", response_model=QueryResponse)
def rag_query(
    request: QueryRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Ask a question about your meetings.
    Uses RAG to find relevant context and generate an answer.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    try:
        result = query_meetings(
            query=request.query,
            user_id=current_user.id,
            top_k=request.top_k,
            use_local_llm=request.use_local_llm,
            local_model=request.local_model,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG query failed: {str(e)}")


@router.post("/search")
def rag_search(
    request: SearchRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Search meetings without generating an answer.
    Returns relevant chunks with scores.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    try:
        results = search_meetings(
            query=request.query,
            user_id=current_user.id,
            top_k=request.top_k,
        )
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.post("/index")
def rag_index_meeting(
    request: IndexRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Index a specific meeting for RAG."""
    meeting = db.query(Meeting).filter(Meeting.id == request.meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    transcript = db.query(Transcript).filter(Transcript.meeting_id == meeting.id).first()
    if not transcript:
        raise HTTPException(status_code=400, detail="No transcript found for this meeting")
    
    try:
        chunks_indexed = index_meeting(
            meeting_id=meeting.id,
            meeting_title=meeting.title,
            transcript=transcript.content,
            user_id=current_user.id,
            meeting_date=meeting.created_at,
        )
        return {"status": "indexed", "chunks": chunks_indexed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")


@router.post("/index-all")
def rag_index_all_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Index all meetings for the current user."""
    meetings = db.query(Meeting).filter(Meeting.owner_id == current_user.id).all()
    
    indexed_count = 0
    total_chunks = 0
    errors = []
    
    for meeting in meetings:
        transcript = db.query(Transcript).filter(Transcript.meeting_id == meeting.id).first()
        if not transcript:
            continue
        
        try:
            chunks = index_meeting(
                meeting_id=meeting.id,
                meeting_title=meeting.title,
                transcript=transcript.content,
                user_id=current_user.id,
                meeting_date=meeting.created_at,
            )
            indexed_count += 1
            total_chunks += chunks
        except Exception as e:
            errors.append({"meeting_id": meeting.id, "error": str(e)})
    
    return {
        "status": "complete",
        "meetings_indexed": indexed_count,
        "total_chunks": total_chunks,
        "errors": errors,
    }


@router.get("/stats")
def rag_stats(current_user: User = Depends(get_current_user)):
    """Get RAG index statistics for the current user."""
    try:
        stats = get_index_stats(current_user.id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")