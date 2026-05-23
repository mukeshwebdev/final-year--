from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import spacy
from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv

load_dotenv()

nlp = None
embedder = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global nlp, embedder
    print("Loading spaCy model...")
    try:
        nlp = spacy.load("en_core_web_sm")
        print("spaCy model loaded.")
    except Exception as e:
        print(f"spaCy load failed: {e}. Run: python -m spacy download en_core_web_sm")
        nlp = None

    print("Loading sentence-transformers model...")
    try:
        embedder = SentenceTransformer("all-MiniLM-L6-v2")
        print("Sentence transformer loaded.")
    except Exception as e:
        print(f"Sentence transformer load failed: {e}")
        embedder = None

    app.state.nlp = nlp
    app.state.embedder = embedder
    yield
    print("Shutting down AI service...")


app = FastAPI(
    title="FIR AI Service",
    description="AI microservice for FIR Management System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import categorize, urgency, ner, duplicate, summarize

app.include_router(categorize.router, prefix="/api/categorize", tags=["Crime Categorization"])
app.include_router(urgency.router, prefix="/api/urgency", tags=["Urgency Scoring"])
app.include_router(ner.router, prefix="/api/ner", tags=["Named Entity Recognition"])
app.include_router(duplicate.router, prefix="/api/duplicate", tags=["Duplicate Detection"])
app.include_router(summarize.router, prefix="/api/summarize", tags=["Case Summarization"])


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "spacy_loaded": app.state.nlp is not None,
        "embedder_loaded": app.state.embedder is not None,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
