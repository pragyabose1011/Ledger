"""RAG service using local embeddings (no OpenAI required).

Features:
- Local sentence-transformers embeddings (all-MiniLM-L6-v2)
- ChromaDB vector store for chunk storage and retrieval
- Ollama for answer generation
- Chunking with overlap for better context
- Meeting-level indexing and querying
- Stats and health checks
"""

import os
import json
import logging
import hashlib
from typing import List, Dict, Optional, Any
from datetime import datetime

import httpx

logger = logging.getLogger(__name__)

# ============================================================================
# Configuration
# ============================================================================

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
CHUNK_SIZE = int(os.getenv("RAG_CHUNK_SIZE", "500"))
CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "50"))
TOP_K = int(os.getenv("RAG_TOP_K", "5"))

# ============================================================================
# Local Embedding Model
# ============================================================================

_embedding_model = None
EMBEDDING_DIM = 384  # all-MiniLM-L6-v2 produces 384-dim vectors

try:
    from sentence_transformers import SentenceTransformer
    _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    logger.info("✅ Loaded local embedding model: all-MiniLM-L6-v2")
except ImportError:
    logger.warning("⚠️ sentence-transformers not installed. RAG will be disabled.")
except Exception as e:
    logger.error(f"⚠️ Failed to load embedding model: {e}")

# ============================================================================
# ChromaDB Vector Store
# ============================================================================

_chroma_client = None
_collection = None

try:
    import chromadb
    _chroma_client = chromadb.Client()
    _collection = _chroma_client.get_or_create_collection(
        name="meeting_chunks",
        metadata={"hnsw:space": "cosine"},
    )
    logger.info("✅ ChromaDB collection ready")
except ImportError:
    logger.warning("⚠️ chromadb not installed. RAG will be disabled.")
except Exception as e:
    logger.error(f"⚠️ Failed to initialize ChromaDB: {e}")


def is_rag_available() -> bool:
    """Check if RAG system is available."""
    return _embedding_model is not None and _collection is not None


# ============================================================================
# Embedding Functions
# ============================================================================

def get_embedding(text: str) -> List[float]:
    """Generate embedding using local sentence-transformers model."""
    if _embedding_model is None:
        logger.error("No embedding model available.")
        return [0.0] * EMBEDDING_DIM
    try:
        return _embedding_model.encode(text).tolist()
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        return [0.0] * EMBEDDING_DIM


def get_embedding_batch(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for multiple texts in a single batch."""
    if _embedding_model is None:
        logger.error("No embedding model available.")
        return [[0.0] * EMBEDDING_DIM for _ in texts]
    try:
        embeddings = _embedding_model.encode(texts)
        return [emb.tolist() for emb in embeddings]
    except Exception as e:
        logger.error(f"Batch embedding generation failed: {e}")
        return [[0.0] * EMBEDDING_DIM for _ in texts]


# ============================================================================
# Chunking
# ============================================================================

def chunk_text(text: str, chunk_size: int = None, overlap: int = None) -> List[str]:
    """Split text into overlapping chunks by word count.

    Args:
        text: The text to chunk
        chunk_size: Number of words per chunk (default from env or 500)
        overlap: Number of overlapping words between chunks (default from env or 50)

    Returns:
        List of text chunks
    """
    if chunk_size is None:
        chunk_size = CHUNK_SIZE
    if overlap is None:
        overlap = CHUNK_OVERLAP

    words = text.split()
    if not words:
        return []

    chunks = []
    step = max(chunk_size - overlap, 1)
    for i in range(0, len(words), step):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk.strip():
            chunks.append(chunk.strip())
    return chunks


def chunk_text_by_sentences(text: str, max_chunk_size: int = 1000) -> List[str]:
    """Split text into chunks by sentences, respecting max size.

    Args:
        text: The text to chunk
        max_chunk_size: Maximum character length per chunk

    Returns:
        List of text chunks
    """
    import re
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    current_chunk = ""

    for sentence in sentences:
        if len(current_chunk) + len(sentence) + 1 > max_chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            current_chunk = sentence
        else:
            current_chunk = current_chunk + " " + sentence if current_chunk else sentence

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks


# ============================================================================
# Indexing
# ============================================================================

def _generate_chunk_id(meeting_id: int, chunk_index: int) -> str:
    """Generate a unique ID for a chunk."""
    return f"meeting-{meeting_id}-chunk-{chunk_index}"


def index_transcript(
    meeting_id: int,
    transcript_text: str,
    meeting_title: str = "",
    meeting_date: str = "",
    participants: str = "",
) -> int:
    """Index a single transcript's chunks into ChromaDB.

    Args:
        meeting_id: Database ID of the meeting
        transcript_text: Full transcript text
        meeting_title: Title of the meeting
        meeting_date: Date of the meeting (ISO format)
        participants: Comma-separated list of participants

    Returns:
        Number of chunks indexed
    """
    if not is_rag_available():
        logger.warning("RAG not available. Skipping indexing.")
        return 0

    if not transcript_text or not transcript_text.strip():
        logger.info(f"Empty transcript for meeting {meeting_id}, skipping.")
        return 0

    # Remove old chunks for this meeting first
    delete_meeting_chunks(meeting_id)

    # Create chunks
    chunks = chunk_text(transcript_text)
    if not chunks:
        return 0

    # Generate embeddings
    embeddings = get_embedding_batch(chunks)

    # Prepare metadata
    ids = [_generate_chunk_id(meeting_id, i) for i in range(len(chunks))]
    metadatas = [
        {
            "meeting_id": str(meeting_id),
            "meeting_title": meeting_title or "",
            "meeting_date": meeting_date or "",
            "participants": participants or "",
            "chunk_index": i,
            "total_chunks": len(chunks),
            "indexed_at": datetime.utcnow().isoformat(),
        }
        for i in range(len(chunks))
    ]

    try:
        _collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas,
        )
        logger.info(f"✅ Indexed {len(chunks)} chunks for meeting {meeting_id} ({meeting_title})")
        return len(chunks)
    except Exception as e:
        logger.error(f"Failed to index meeting {meeting_id}: {e}")
        return 0


# ...existing code...


def index_all_transcripts(db) -> dict:
    """Index all transcripts in the database.

    Args:
        db: SQLAlchemy database session

    Returns:
        Dictionary with indexing statistics
    """
    from app.db.models.meeting import Meeting
    from app.db.models.transcript import Transcript

    if not is_rag_available():
        return {
            "status": "error",
            "message": "RAG is not available. Install sentence-transformers and chromadb.",
            "indexed_meetings": 0,
            "total_chunks": 0,
            "total_meetings": 0,
        }

    meetings = db.query(Meeting).all()
    total_chunks = 0
    indexed_meetings = 0
    skipped_meetings = 0
    failed_meetings = 0
    errors = []

    for meeting in meetings:
        try:
            # Try to get transcript text from different possible sources:
            transcript_text = ""

            # Option 1: Meeting has a direct 'transcript' attribute
            if hasattr(meeting, "transcript") and meeting.transcript:
                transcript_text = meeting.transcript

            # Option 2: Meeting has a relationship to Transcript model (e.g., meeting.transcripts)
            elif hasattr(meeting, "transcripts") and meeting.transcripts:
                # Combine all transcript entries for this meeting
                parts = []
                for t in meeting.transcripts:
                    if hasattr(t, "content") and t.content:
                        parts.append(t.content)
                    elif hasattr(t, "text") and t.text:
                        parts.append(t.text)
                    elif hasattr(t, "raw_text") and t.raw_text:
                        parts.append(t.raw_text)
                transcript_text = "\n\n".join(parts)

            # Option 3: Query Transcript table directly
            if not transcript_text:
                transcript_entries = db.query(Transcript).filter(
                    Transcript.meeting_id == meeting.id
                ).all()
                parts = []
                for t in transcript_entries:
                    if hasattr(t, "content") and t.content:
                        parts.append(t.content)
                    elif hasattr(t, "text") and t.text:
                        parts.append(t.text)
                    elif hasattr(t, "raw_text") and t.raw_text:
                        parts.append(t.raw_text)
                transcript_text = "\n\n".join(parts)

            if not transcript_text.strip():
                skipped_meetings += 1
                continue

            # Get meeting metadata
            title = meeting.title or f"Meeting {meeting.id}"
            date_str = ""
            if hasattr(meeting, "date") and meeting.date:
                date_str = str(meeting.date)
            elif hasattr(meeting, "created_at") and meeting.created_at:
                date_str = str(meeting.created_at)

            participants_str = ""
            if hasattr(meeting, "participants") and meeting.participants:
                try:
                    participants_str = ", ".join(
                        [getattr(p, "name", None) or getattr(p, "email", "") or ""
                         for p in meeting.participants]
                    )
                except Exception:
                    pass

            count = index_transcript(
                meeting.id,
                transcript_text,
                meeting_title=title,
                meeting_date=date_str,
                participants=participants_str,
            )
            total_chunks += count
            if count > 0:
                indexed_meetings += 1
            else:
                skipped_meetings += 1
        except Exception as e:
            failed_meetings += 1
            errors.append(f"Meeting {meeting.id}: {str(e)}")
            logger.error(f"Failed to index meeting {meeting.id}: {e}")

    result = {
        "status": "success",
        "indexed_meetings": indexed_meetings,
        "skipped_meetings": skipped_meetings,
        "failed_meetings": failed_meetings,
        "total_chunks": total_chunks,
        "total_meetings": len(meetings),
    }
    if errors:
        result["errors"] = errors

    logger.info(f"📊 RAG indexing complete: {result}")
    return result


# ...existing code...


def delete_meeting_chunks(meeting_id: int) -> int:
    """Delete all chunks for a specific meeting.

    Args:
        meeting_id: Database ID of the meeting

    Returns:
        Number of chunks deleted
    """
    if _collection is None:
        return 0

    try:
        # Get existing chunks for this meeting
        existing = _collection.get(
            where={"meeting_id": str(meeting_id)},
        )
        if existing and existing["ids"]:
            _collection.delete(ids=existing["ids"])
            logger.info(f"🗑️ Deleted {len(existing['ids'])} chunks for meeting {meeting_id}")
            return len(existing["ids"])
    except Exception as e:
        logger.error(f"Failed to delete chunks for meeting {meeting_id}: {e}")
    return 0


def clear_all_chunks() -> int:
    """Clear all chunks from the collection.

    Returns:
        Number of chunks deleted
    """
    global _collection
    if _chroma_client is None:
        return 0

    try:
        count = _collection.count() if _collection else 0
        _chroma_client.delete_collection("meeting_chunks")
        _collection = _chroma_client.get_or_create_collection(
            name="meeting_chunks",
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(f"🗑️ Cleared all {count} chunks from collection")
        return count
    except Exception as e:
        logger.error(f"Failed to clear chunks: {e}")
        return 0


# ============================================================================
# Querying
# ============================================================================

def search_chunks(
    question: str,
    top_k: int = None,
    meeting_id: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Search for relevant chunks using vector similarity.

    Args:
        question: The search query
        top_k: Number of results to return
        meeting_id: Optional filter to search within a specific meeting

    Returns:
        List of dictionaries with document, metadata, and distance
    """
    if not is_rag_available():
        return []

    if top_k is None:
        top_k = TOP_K

    query_embedding = get_embedding(question)

    try:
        query_params = {
            "query_embeddings": [query_embedding],
            "n_results": top_k,
        }
        if meeting_id is not None:
            query_params["where"] = {"meeting_id": str(meeting_id)}

        results = _collection.query(**query_params)

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        search_results = []
        for doc, meta, dist in zip(documents, metadatas, distances):
            search_results.append({
                "document": doc,
                "metadata": meta,
                "distance": dist,
                "similarity": 1 - dist,  # cosine distance to similarity
            })

        return search_results
    except Exception as e:
        logger.error(f"Search failed: {e}")
        return []


def build_context(search_results: List[Dict[str, Any]]) -> str:
    """Build context string from search results.

    Args:
        search_results: List of search result dictionaries

    Returns:
        Formatted context string
    """
    if not search_results:
        return ""

    context_parts = []
    for result in search_results:
        meta = result.get("metadata", {})
        title = meta.get("meeting_title", "Unknown Meeting")
        date = meta.get("meeting_date", "")
        participants = meta.get("participants", "")
        doc = result.get("document", "")

        header = f"[Meeting: {title}"
        if date:
            header += f" | Date: {date}"
        if participants:
            header += f" | Participants: {participants}"
        header += "]"

        context_parts.append(f"{header}\n{doc}")

    return "\n\n---\n\n".join(context_parts)


def generate_answer_with_ollama(question: str, context: str) -> str:
    """Generate an answer using Ollama based on the provided context.

    Args:
        question: The user's question
        context: The relevant meeting transcript context

    Returns:
        Generated answer string
    """
    prompt = f"""You are a helpful assistant that answers questions about meetings based on meeting transcripts.

Based on the following meeting transcripts, answer the question accurately and concisely.
If the answer is not in the transcripts, say "I couldn't find that information in the meeting data."
Include relevant details like who said what, when decisions were made, and any action items mentioned.

Meeting Transcripts:
---
{context}
---

Question: {question}

Answer:"""

    try:
        with httpx.Client(timeout=120) as client:
            response = client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                },
            )
            response.raise_for_status()
            result = response.json()
            answer = result.get("response", "").strip()
            if not answer:
                return "The AI model returned an empty response. Please try again."
            return answer
    except httpx.ConnectError:
        logger.error("Cannot connect to Ollama. Is it running?")
        return "Cannot connect to Ollama. Please make sure it's running with: ollama serve"
    except httpx.TimeoutException:
        logger.error("Ollama request timed out.")
        return "The request timed out. The question may be too complex or the model is still loading."
    except Exception as e:
        logger.error(f"Ollama query failed: {e}")
        return f"Failed to generate answer: {str(e)}"


def query_rag(
    question: str,
    top_k: int = None,
    meeting_id: Optional[int] = None,
) -> str:
    """Query the RAG system: retrieve relevant chunks, then generate answer with Ollama.

    Args:
        question: The user's question
        top_k: Number of chunks to retrieve
        meeting_id: Optional filter to search within a specific meeting

    Returns:
        Generated answer string
    """
    if not is_rag_available():
        return "RAG is not available. Please install sentence-transformers and chromadb."

    if not question or not question.strip():
        return "Please provide a question."

    # 1. Search for relevant chunks
    search_results = search_chunks(question, top_k=top_k, meeting_id=meeting_id)

    if not search_results:
        return "No relevant meeting data found. Try indexing your meetings first."

    # 2. Build context
    context = build_context(search_results)

    if not context:
        return "No relevant meeting data found."

    # 3. Generate answer using Ollama
    answer = generate_answer_with_ollama(question, context)

    return answer


# ============================================================================
# Stats & Health
# ============================================================================

def get_stats() -> dict:
    """Get RAG index statistics."""
    stats = {
        "embedding_model": "all-MiniLM-L6-v2" if _embedding_model else "not loaded",
        "embedding_dim": EMBEDDING_DIM,
        "vector_store": "chromadb" if _collection else "not available",
        "llm_provider": "ollama",
        "llm_model": OLLAMA_MODEL,
        "ollama_url": OLLAMA_URL,
        "chunk_size": CHUNK_SIZE,
        "chunk_overlap": CHUNK_OVERLAP,
        "top_k": TOP_K,
    }

    if _collection is not None:
        try:
            count = _collection.count()
            stats["status"] = "ready"
            stats["total_chunks"] = count
        except Exception as e:
            stats["status"] = "error"
            stats["total_chunks"] = 0
            stats["error"] = str(e)
    else:
        stats["status"] = "disabled"
        stats["total_chunks"] = 0

    return stats


def health_check() -> dict:
    """Check health of all RAG components."""
    health = {
        "embedding_model": _embedding_model is not None,
        "vector_store": _collection is not None,
        "ollama": False,
    }

    # Check Ollama connectivity
    try:
        with httpx.Client(timeout=5) as client:
            response = client.get(f"{OLLAMA_URL}/api/tags")
            health["ollama"] = response.status_code == 200
    except Exception:
        health["ollama"] = False

    health["overall"] = all(health.values())
    return health