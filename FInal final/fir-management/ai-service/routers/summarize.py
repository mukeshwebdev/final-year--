from fastapi import APIRouter
from pydantic import BaseModel
import os
import re

router = APIRouter()


class SummarizeRequest(BaseModel):
    fir_text: str
    investigation_notes: str | None = None
    crime_type: str | None = None
    status: str | None = None


class SummarizeResponse(BaseModel):
    summary: str
    key_points: list[str]
    method: str


async def summarize_with_gemini(body: SummarizeRequest) -> str | None:
    try:
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        notes_section = f"\n\nInvestigation Notes:\n{body.investigation_notes}" if body.investigation_notes else ""
        prompt = f"""You are a police case summarization assistant. Summarize the following FIR and investigation details in 3-5 concise lines suitable for an Inspector's dashboard. Focus on: what happened, who is involved, current status, and key actions needed.

FIR Description:
{body.fir_text}
{notes_section}
Crime Type: {body.crime_type or "Unknown"}
Status: {body.status or "Filed"}

Provide a clear, factual summary in 3-5 sentences. Do not add any preamble."""

        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini summarization failed: {e}")
        return None


def rule_based_summary(body: SummarizeRequest) -> tuple[str, list[str]]:
    words = body.fir_text.split()
    first_sentence = " ".join(words[:40]) + ("..." if len(words) > 40 else "")

    key_points = []

    if body.crime_type:
        key_points.append(f"Crime type: {body.crime_type}")
    if body.status:
        key_points.append(f"Current status: {body.status}")
    if body.investigation_notes:
        note_words = body.investigation_notes.split()
        key_points.append("Investigation notes: " + " ".join(note_words[:20]) + ("..." if len(note_words) > 20 else ""))

    summary = f"This case involves {body.crime_type or 'a criminal incident'}. {first_sentence}"
    if body.investigation_notes:
        summary += f" Investigation is {body.status or 'ongoing'}."

    return summary, key_points


@router.post("", response_model=SummarizeResponse)
async def summarize_case(body: SummarizeRequest):
    gemini_summary = await summarize_with_gemini(body)

    if gemini_summary:
        sentences = [s.strip() for s in gemini_summary.split(".") if s.strip()]
        key_points = sentences[:5]
        return SummarizeResponse(
            summary=gemini_summary,
            key_points=key_points,
            method="gemini",
        )

    summary, key_points = rule_based_summary(body)
    return SummarizeResponse(
        summary=summary,
        key_points=key_points,
        method="rule_based",
    )
