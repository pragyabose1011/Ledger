"""
RAG (Retrieval-Augmented Generation) service for querying meeting history.

Uses:
- OpenAI embeddings for vector search
- ChromaDB for local vector storage
- GPT-4 or Ollama for answer generation
"""
import os
import hashlib
from typing import List, Optional, Dict, Any
from datetime import datetime

# Lazy import chromadb to handle missing dependency gracefully
chromadb = None

def _ensure_chromadb():
    global chromadb
    if chromadb is None:
        try:
            import chromadb as _chromadb
            chromadb = _chromadb
        except ImportError:
            raise ImportError("ChromaDB is not installed. Run: pip install chromadb")

# Initialize OpenAI client (lazy load to handle missing key gracefully)
_openai_client = None
_chroma_client = None
_collection = None

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
USE_OLLAMA = os.getenv("USE_OLLAMA", "false").lower() == "true"


def get_openai_client():
    """Lazy load OpenAI client."""
    global _openai_client
    if _openai_client is None:
        from openai import OpenAI
        _openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _openai_client


def get_chroma_collection():
    """Get or create ChromaDB collection."""
    global _chroma_client, _collection
    _ensure_chromadb()
    
    if _collection is None:
        # Store in backend directory
        persist_dir = os.path.join(os.path.dirname(__file__), "..", "..", "chroma_db")
        os.makedirs(persist_dir, exist_ok=True)
        
        _chroma_client = chromadb.PersistentClient(path=persist_dir)
        _collection = _chroma_client.get_or_create_collection(
            name="meeting_transcripts",
            metadata={"hnsw:space": "cosine"}
        )
    
    return _collection


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks by words."""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    
    return chunks


def get_embedding(text: str) -> List[float]:
    """Generate embedding using OpenAI."""
    client = get_openai_client()
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding


def get_embedding_batch(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for multiple texts."""
    client = get_openai_client()
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
    )
    return [item.embedding for item in response.data]


def generate_chunk_id(meeting_id: str, chunk_index: int) -> str:
    """Generate a unique ID for a chunk."""
    return hashlib.md5(f"{meeting_id}_{chunk_index}".encode()).hexdigest()


def index_meeting(
    meeting_id: str,
    meeting_title: str,
    transcript: str,
    user_id: str,
    meeting_date: Optional[datetime] = None,
) -> int:
    """
    Index a meeting transcript for RAG.
    Returns the number of chunks indexed.
    """
    collection = get_chroma_collection()
    
    # Remove existing chunks for this meeting (in case of re-index)
    try:
        existing = collection.get(where={"meeting_id": meeting_id})
        if existing["ids"]:
            collection.delete(ids=existing["ids"])
    except Exception:
        pass  # Collection might be empty
    
    # Chunk the transcript
    chunks = chunk_text(transcript)
    
    if not chunks:
        return 0
    
    # Generate embeddings
    embeddings = get_embedding_batch(chunks)
    
    # Prepare data for ChromaDB
    ids = [generate_chunk_id(meeting_id, i) for i in range(len(chunks))]
    metadatas = [
        {
            "meeting_id": meeting_id,
            "meeting_title": meeting_title,
            "user_id": user_id,
            "chunk_index": i,
            "date": meeting_date.isoformat() if meeting_date else "",
        }
        for i in range(len(chunks))
    ]
    
    # Add to collection
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )
    
    print(f"✅ Indexed {len(chunks)} chunks for meeting: {meeting_title}")
    return len(chunks)


def search_meetings(
    query: str,
    user_id: str,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Search for relevant meeting chunks.
    Returns list of {text, meeting_id, meeting_title, score}.
    """
    collection = get_chroma_collection()
    
    # Get query embedding
    query_embedding = get_embedding(query)
    
    # Search
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"user_id": user_id},
        include=["documents", "metadatas", "distances"],
    )
    
    # Format results
    formatted = []
    for i, doc in enumerate(results["documents"][0]):
        metadata = results["metadatas"][0][i]
        distance = results["distances"][0][i]
        
        formatted.append({
            "text": doc,
            "meeting_id": metadata["meeting_id"],
            "meeting_title": metadata["meeting_title"],
            "date": metadata.get("date", ""),
            "score": 1 - distance,  # Convert distance to similarity
        })
    
    return formatted


def generate_answer_openai(query: str, context: str) -> str:
    """Generate answer using OpenAI GPT-4."""
    client = get_openai_client()
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": """You are a helpful assistant that answers questions based on meeting transcripts.
                
Rules:
- Only answer based on the provided context
- If the answer isn't in the context, say "I couldn't find that information in your meetings"
- Cite which meeting the information comes from
- Be concise but complete"""
            },
            {
                "role": "user",
                "content": f"""Context from meeting transcripts:
---
{context}
---

Question: {query}

Answer based on the context above:"""
            }
        ],
        temperature=0.3,
        max_tokens=500,
    )
    
    return response.choices[0].message.content


def generate_answer_ollama(query: str, context: str, model: str = "llama3.1:8b") -> str:
    """Generate answer using local Ollama."""
    import httpx
    
    prompt = f"""You are a helpful assistant that answers questions based on meeting transcripts.

Context from meeting transcripts:
---
{context}
---

Question: {query}

Answer based on the context above. If the answer isn't in the context, say "I couldn't find that information in your meetings". Cite which meeting the information comes from."""

    try:
        with httpx.Client(timeout=120) as client:
            response = client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                },
            )
            return response.json()["response"]
    except Exception as e:
        return f"Error connecting to Ollama: {e}. Make sure Ollama is running."


def query_meetings(
    query: str,
    user_id: str,
    top_k: int = 5,
    use_local_llm: bool = False,
    local_model: str = "llama3.1:8b",
) -> Dict[str, Any]:
    """
    Full RAG pipeline: search + generate answer.
    
    Returns:
    {
        "answer": "...",
        "sources": [{"meeting_title": "...", "meeting_id": "...", "excerpt": "..."}],
        "model": "gpt-4o-mini" or "llama3.1:8b"
    }
    """
    # Search for relevant chunks
    search_results = search_meetings(query, user_id, top_k)
    
    if not search_results:
        return {
            "answer": "I couldn't find any relevant information in your meetings. Try uploading more meeting transcripts.",
            "sources": [],
            "model": "none",
        }
    
    # Build context from search results
    context_parts = []
    seen_meetings = set()
    sources = []
    
    for result in search_results:
        meeting_title = result["meeting_title"]
        context_parts.append(f"[From: {meeting_title}]\n{result['text']}")
        
        if result["meeting_id"] not in seen_meetings:
            seen_meetings.add(result["meeting_id"])
            sources.append({
                "meeting_title": meeting_title,
                "meeting_id": result["meeting_id"],
                "excerpt": result["text"][:200] + "..." if len(result["text"]) > 200 else result["text"],
                "score": round(result["score"], 2),
            })
    
    context = "\n\n".join(context_parts)
    
    # Generate answer
    if use_local_llm or USE_OLLAMA:
        answer = generate_answer_ollama(query, context, local_model)
        model_used = local_model
    else:
        answer = generate_answer_openai(query, context)
        model_used = "gpt-4o-mini"
    
    return {
        "answer": answer,
        "sources": sources,
        "model": model_used,
    }


def get_index_stats(user_id: str) -> Dict[str, Any]:
    """Get statistics about indexed meetings for a user."""
    collection = get_chroma_collection()
    
    try:
        results = collection.get(
            where={"user_id": user_id},
            include=["metadatas"],
        )
        
        meeting_ids = set()
        for metadata in results["metadatas"]:
            meeting_ids.add(metadata["meeting_id"])
        
        return {
            "total_chunks": len(results["ids"]),
            "total_meetings": len(meeting_ids),
            "indexed": True,
        }
    except Exception:
        return {
            "total_chunks": 0,
            "total_meetings": 0,
            "indexed": False,
        }