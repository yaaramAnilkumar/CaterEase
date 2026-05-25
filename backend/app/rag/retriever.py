"""
CaterEase RAG Retriever
Uses ChromaDB with sentence-transformers (all-MiniLM-L6-v2) for semantic search.
The collection is seeded from knowledge_base.py on first use and persisted to disk.
"""

import os
import logging

logger = logging.getLogger(__name__)

_collection = None  # lazy-loaded singleton


def _get_collection():
    global _collection
    if _collection is not None:
        return _collection

    try:
        import chromadb
        from chromadb.utils import embedding_functions

        # Persist the vector DB next to this file's package root
        db_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "chroma_db")
        )
        os.makedirs(db_path, exist_ok=True)

        client = chromadb.PersistentClient(path=db_path)

        # Default embedding: all-MiniLM-L6-v2 via sentence-transformers (~90 MB, downloaded once)
        ef = embedding_functions.DefaultEmbeddingFunction()

        _collection = client.get_or_create_collection(
            name="caterease_kb",
            embedding_function=ef,
            metadata={"hnsw:space": "cosine"},
        )

        # Seed on first run (or if collection was cleared)
        if _collection.count() == 0:
            logger.info("[RAG] Seeding knowledge base into ChromaDB…")
            from app.rag.knowledge_base import DOCUMENTS

            _collection.add(
                ids=[doc["id"] for doc in DOCUMENTS],
                documents=[doc["content"] for doc in DOCUMENTS],
                metadatas=[doc["metadata"] for doc in DOCUMENTS],
            )
            logger.info(f"[RAG] Seeded {len(DOCUMENTS)} documents.")
        else:
            logger.info(f"[RAG] Loaded existing collection ({_collection.count()} docs).")

    except Exception as exc:
        logger.error(f"[RAG] Failed to initialise ChromaDB: {exc}")
        _collection = None  # stay None — will fall through to keyword fallback

    return _collection


_STOP_WORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "on", "at", "by", "for", "with", "about",
    "against", "between", "into", "through", "during", "before", "after",
    "above", "below", "from", "up", "down", "out", "off", "over", "under",
    "again", "further", "then", "once", "and", "but", "or", "nor", "so",
    "yet", "both", "either", "neither", "not", "only", "own", "same",
    "than", "too", "very", "i", "me", "my", "we", "our", "you", "your",
    "he", "she", "it", "they", "them", "their", "this", "that", "these",
    "those", "what", "which", "who", "how", "when", "where", "why",
}


def _keyword_fallback(query: str) -> str:
    """Keyword overlap fallback (stop-word filtered) when ChromaDB is unavailable."""
    import re
    from app.rag.knowledge_base import DOCUMENTS

    def tokenize(text: str) -> set:
        tokens = re.findall(r"[a-z]+", text.lower())
        return {t for t in tokens if t not in _STOP_WORDS and len(t) > 2}

    q_words = tokenize(query)
    if not q_words:
        return ""

    scored = []
    for doc in DOCUMENTS:
        content_words = tokenize(doc["content"])
        # Weight: (matching unique keywords) × (log of term frequency bonus)
        matches = q_words & content_words
        score = len(matches)
        if score > 0:
            scored.append((score, doc["content"]))

    scored.sort(key=lambda x: -x[0])
    top = [text for _, text in scored[:3]]
    return "\n\n".join(f"[{i+1}] {t}" for i, t in enumerate(top)) if top else ""


def search_kb(query: str, n_results: int = 3) -> str:
    """
    Search the knowledge base for context relevant to `query`.
    Returns a formatted string of the top matching document chunks,
    or an empty string if nothing useful is found.
    """
    collection = _get_collection()

    if collection is not None:
        try:
            count = collection.count()
            if count == 0:
                return ""
            results = collection.query(
                query_texts=[query],
                n_results=min(n_results, count),
            )
            docs = results.get("documents", [[]])[0]
            distances = results.get("distances", [[]])[0]

            # Filter out low-relevance results (cosine distance > 0.8 = poor match)
            relevant = [
                doc for doc, dist in zip(docs, distances) if dist < 0.8
            ]
            if not relevant:
                return ""
            return "\n\n".join(f"[{i+1}] {doc}" for i, doc in enumerate(relevant))

        except Exception as exc:
            logger.warning(f"[RAG] ChromaDB query failed, using keyword fallback: {exc}")

    # Keyword fallback
    return _keyword_fallback(query)
