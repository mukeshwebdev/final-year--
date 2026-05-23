from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

CRITICAL_KEYWORDS = [
    "murder", "killed", "homicide", "rape", "bomb", "terrorist", "hostage",
    "kidnapping", "abduction", "shooting", "stabbing", "explosion", "fire",
    "dead body", "critical condition", "life threatening", "missing child",
]

HIGH_KEYWORDS = [
    "assault", "robbery", "attack", "weapon", "gun", "knife", "blood",
    "injured", "hospital", "unconscious", "gang", "armed", "domestic violence",
    "threat", "extortion", "blackmail",
]

MEDIUM_KEYWORDS = [
    "theft", "stolen", "fraud", "cheated", "harassment", "stalking",
    "vandalism", "drug", "accident", "missing person", "cybercrime",
]

LOW_KEYWORDS = [
    "noise complaint", "trespassing", "minor dispute", "lost property",
    "parking", "civil matter", "document fraud",
]


class UrgencyRequest(BaseModel):
    description: str


class UrgencyResponse(BaseModel):
    urgency: str
    score: int
    matched_keywords: list[str]
    reasoning: str


@router.post("", response_model=UrgencyResponse)
async def score_urgency(body: UrgencyRequest):
    text = body.description.lower()
    matched = []
    score = 0

    for kw in CRITICAL_KEYWORDS:
        if kw in text:
            score += 10
            matched.append(kw)

    for kw in HIGH_KEYWORDS:
        if kw in text:
            score += 5
            matched.append(kw)

    for kw in MEDIUM_KEYWORDS:
        if kw in text:
            score += 2
            matched.append(kw)

    for kw in LOW_KEYWORDS:
        if kw in text:
            score += 1
            matched.append(kw)

    word_count = len(text.split())
    if word_count > 100:
        score += 2

    if score >= 15:
        urgency = "CRITICAL"
        reasoning = "Contains indicators of life-threatening or major crime."
    elif score >= 8:
        urgency = "HIGH"
        reasoning = "Contains indicators of serious crime requiring immediate attention."
    elif score >= 3:
        urgency = "MEDIUM"
        reasoning = "Moderate severity crime that needs prompt attention."
    else:
        urgency = "LOW"
        reasoning = "Low severity incident or insufficient detail provided."

    return UrgencyResponse(
        urgency=urgency,
        score=score,
        matched_keywords=list(set(matched)),
        reasoning=reasoning,
    )
