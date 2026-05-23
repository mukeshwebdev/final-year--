from fastapi import APIRouter, Request
from pydantic import BaseModel
import numpy as np

router = APIRouter()

DUPLICATE_THRESHOLD = 0.85

fir_store: list[dict] = []


class DuplicateCheckRequest(BaseModel):
    description: str
    existing_firs: list[dict]


class DuplicateMatch(BaseModel):
    fir_id: str
    fir_number: str
    similarity: float
    description_snippet: str


class DuplicateResponse(BaseModel):
    is_duplicate: bool
    highest_similarity: float
    matches: list[DuplicateMatch]
    threshold: float


@router.post("", response_model=DuplicateResponse)
async def check_duplicate(request: Request, body: DuplicateCheckRequest):
    embedder = request.app.state.embedder

    if embedder is None or not body.existing_firs:
        return DuplicateResponse(
            is_duplicate=False,
            highest_similarity=0.0,
            matches=[],
            threshold=DUPLICATE_THRESHOLD,
        )

    new_embedding = embedder.encode([body.description])

    existing_texts = [fir.get("description", "") for fir in body.existing_firs]
    if not existing_texts:
        return DuplicateResponse(
            is_duplicate=False,
            highest_similarity=0.0,
            matches=[],
            threshold=DUPLICATE_THRESHOLD,
        )

    existing_embeddings = embedder.encode(existing_texts)

    similarities = []
    for i, emb in enumerate(existing_embeddings):
        dot = np.dot(new_embedding[0], emb)
        norm_new = np.linalg.norm(new_embedding[0])
        norm_ex = np.linalg.norm(emb)
        sim = float(dot / (norm_new * norm_ex + 1e-8))
        similarities.append(sim)

    matches = []
    for i, sim in enumerate(similarities):
        if sim >= DUPLICATE_THRESHOLD * 0.8:
            fir = body.existing_firs[i]
            snippet = fir.get("description", "")[:150] + "..." if len(fir.get("description", "")) > 150 else fir.get("description", "")
            matches.append(
                DuplicateMatch(
                    fir_id=fir.get("id", ""),
                    fir_number=fir.get("firNumber", ""),
                    similarity=round(sim, 4),
                    description_snippet=snippet,
                )
            )

    matches.sort(key=lambda x: x.similarity, reverse=True)
    highest = max(similarities) if similarities else 0.0

    return DuplicateResponse(
        is_duplicate=highest >= DUPLICATE_THRESHOLD,
        highest_similarity=round(highest, 4),
        matches=matches[:5],
        threshold=DUPLICATE_THRESHOLD,
    )
