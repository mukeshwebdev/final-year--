from fastapi import APIRouter, Request
from pydantic import BaseModel
import os
import re

router = APIRouter()

CRIME_KEYWORDS = {
    "Theft": ["steal", "stolen", "theft", "burglary", "pickpocket", "shoplifting", "robbed", "larceny"],
    "Assault": ["assault", "attack", "beat", "hit", "punch", "slap", "physical", "violence", "battered"],
    "Murder": ["murder", "killed", "homicide", "death", "dead", "stabbed fatally", "shot dead"],
    "Robbery": ["robbery", "robbed", "snatched", "looted", "gunpoint", "knife point", "dacoity"],
    "Fraud": ["fraud", "cheated", "scam", "forgery", "fake", "deceived", "embezzle", "misappropriate"],
    "Cybercrime": ["cyber", "hacked", "phishing", "online fraud", "internet", "ransomware", "data breach", "social media"],
    "Domestic Violence": ["domestic", "husband", "wife", "spouse", "family violence", "abuse at home", "dowry"],
    "Harassment": ["harass", "stalk", "threaten", "intimidate", "molest", "sexual harassment", "eve teasing"],
    "Kidnapping": ["kidnap", "abduct", "missing person", "held captive", "ransom"],
    "Drug Offense": ["drug", "narcotics", "cocaine", "heroin", "marijuana", "ganja", "substance abuse"],
    "Vandalism": ["vandalism", "damage", "graffiti", "destroyed property", "arson", "fire"],
    "Extortion": ["extortion", "blackmail", "demand money", "threat for money"],
}

CRIME_TYPES = list(CRIME_KEYWORDS.keys())


class CategorizeRequest(BaseModel):
    description: str


class CategorizeResponse(BaseModel):
    crime_type: str
    confidence: float
    all_scores: dict


def score_description(description: str) -> dict:
    text = description.lower()
    scores = {}
    for crime, keywords in CRIME_KEYWORDS.items():
        score = 0
        for kw in keywords:
            if kw in text:
                score += 1
        scores[crime] = round(score / len(keywords), 4)
    return scores


async def categorize_with_gemini(description: str) -> dict:
    try:
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""You are a police crime classification expert. Classify the following incident description into exactly one of these categories:
{', '.join(CRIME_TYPES)}

Incident: {description}

Respond in JSON format only:
{{"crime_type": "<category>", "confidence": <0.0-1.0>, "reasoning": "<brief reason>"}}"""
        response = model.generate_content(prompt)
        text = response.text.strip()
        text = re.sub(r"```json\n?", "", text).replace("```", "").strip()
        import json
        result = json.loads(text)
        return result
    except Exception as e:
        print(f"Gemini categorization failed: {e}")
        return None


@router.post("", response_model=CategorizeResponse)
async def categorize_crime(request: Request, body: CategorizeRequest):
    description = body.description.strip()
    if not description:
        return CategorizeResponse(crime_type="Unknown", confidence=0.0, all_scores={})

    gemini_result = await categorize_with_gemini(description)
    if gemini_result and gemini_result.get("crime_type") in CRIME_TYPES:
        all_scores = score_description(description)
        return CategorizeResponse(
            crime_type=gemini_result["crime_type"],
            confidence=float(gemini_result.get("confidence", 0.85)),
            all_scores=all_scores,
        )

    scores = score_description(description)
    if not scores or max(scores.values()) == 0:
        return CategorizeResponse(crime_type="Other", confidence=0.1, all_scores=scores)

    best_crime = max(scores, key=scores.get)
    best_score = scores[best_crime]
    total = sum(scores.values()) or 1
    confidence = round(best_score / total, 4) if total > 0 else 0.1

    return CategorizeResponse(crime_type=best_crime, confidence=confidence, all_scores=scores)
