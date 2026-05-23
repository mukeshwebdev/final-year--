from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class NERRequest(BaseModel):
    text: str


class Entity(BaseModel):
    text: str
    label: str
    start: int
    end: int


class NERResponse(BaseModel):
    entities: list[Entity]
    accused_names: list[str]
    locations: list[str]
    dates: list[str]
    organizations: list[str]
    persons: list[str]


@router.post("", response_model=NERResponse)
async def extract_entities(request: Request, body: NERRequest):
    nlp = request.app.state.nlp

    if nlp is None:
        return NERResponse(
            entities=[],
            accused_names=[],
            locations=[],
            dates=[],
            organizations=[],
            persons=[],
        )

    doc = nlp(body.text)

    entities = []
    accused_names = []
    locations = []
    dates = []
    organizations = []
    persons = []

    for ent in doc.ents:
        entities.append(Entity(text=ent.text, label=ent.label_, start=ent.start_char, end=ent.end_char))

        if ent.label_ == "PERSON":
            persons.append(ent.text)
            text_before = body.text[max(0, ent.start_char - 100) : ent.start_char].lower()
            accused_indicators = ["accused", "suspect", "perpetrator", "offender", "criminal", "attacker", "defendant"]
            if any(ind in text_before for ind in accused_indicators):
                accused_names.append(ent.text)

        elif ent.label_ in ("GPE", "LOC", "FAC"):
            locations.append(ent.text)

        elif ent.label_ in ("DATE", "TIME"):
            dates.append(ent.text)

        elif ent.label_ == "ORG":
            organizations.append(ent.text)

    return NERResponse(
        entities=entities,
        accused_names=list(set(accused_names)),
        locations=list(set(locations)),
        dates=list(set(dates)),
        organizations=list(set(organizations)),
        persons=list(set(persons)),
    )
