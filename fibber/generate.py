from __future__ import annotations

import json
import logging
import os
import random
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

DEFAULT_ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
MAX_HEADLINE_LENGTH = 110
FAKE_SOURCE_TEXT = "Invented for this puzzle."

GENERATE_FAKE_SYSTEM_PROMPT = """You are a master headline writer for "Fibber", a daily fake-headline game.
Players are shown 4 bizarre news headlines (3 real, 1 fake) and must spot the single fake.

YOUR TASK:
Given 3 real, absurd news headlines for a round, invent 1 FAKE headline that seamlessly matches their tone, humor, rhythm, and length.

STRICT RULES FOR THE FAKE:
1. NO REAL NAMED PEOPLE: Do not name real celebrities, politicians, or living private citizens.
2. NO REAL COMPANIES OR BRANDS: Do not use real trademarks or corporations (e.g. no Walmart, IKEA, Apple, McDonald's). Use generic descriptions ("a Swedish furniture retailer", "a fast food chain", "a national railway").
3. NO HUMAN HARM: No death, injury, abuse, violence against humans, or sexual themes.
4. PLAUSIBLE BUT ABSURD: It should sound just plausible enough to fool someone next to the 3 real headlines.
5. LENGTH: Under 110 characters (aim for 55-95 characters).
6. FORMAT: Return ONLY a JSON object: {"t": "The fake headline under 110 chars"}"""


from fibber.ai import generate_completion, clean_json_response, resolve_provider_and_key


def call_anthropic_generate_fake(
    round_real_stories: List[Dict[str, Any]],
    round_number: int = 1,
    exclude: Optional[List[str]] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
) -> str:
    """Call configured AI provider (Gemini, OpenAI, Anthropic, Meta) to generate a convincing fake headline."""
    real_headlines = [story["t"] for story in round_real_stories]
    exclude_text = ""
    if exclude:
        exclude_text = f"\nDO NOT generate any of these previously rejected headlines:\n" + "\n".join(f"- {h}" for h in exclude)

    user_prompt = (
        f"Here are the 3 real news headlines for Round {round_number}:\n"
        + "\n".join(f"{i+1}. {h}" for i, h in enumerate(real_headlines))
        + exclude_text
        + "\n\nInvent 1 single fake headline matching this style. Return JSON: {\"t\": \"...\"}"
    )

    content_text = generate_completion(
        system_prompt=GENERATE_FAKE_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.8,
        max_tokens=256,
        model=model,
        api_key=api_key,
    )

    cleaned_json = clean_json_response(content_text)
    data = json.loads(cleaned_json)
    fake_headline = data.get("t", "").strip()

    if len(fake_headline) > MAX_HEADLINE_LENGTH:
        fake_headline = fake_headline[:MAX_HEADLINE_LENGTH].rsplit(" ", 1)[0].rstrip(",.- ")

    return fake_headline


# Fixture fakes for dry-run
FIXTURE_FAKES = [
    "Vermont town fines residents who fail to wave at snowplow drivers",
    "Dutch railway offers free tickets to passengers who bring a sourdough starter",
    "Ohio library begins lending out retired librarians as in-person search engines",
    "Belgian town bans whistling after 8 PM to prevent confusion among local birds",
    "Scottish village establishes honorary diplomatic relations with visiting seal",
]


def generate_fake_for_round(
    round_real_stories: List[Dict[str, Any]],
    round_number: int = 1,
    exclude: Optional[List[str]] = None,
    dry_run: bool = False,
    api_key: Optional[str] = None,
    model: str = DEFAULT_ANTHROPIC_MODEL,
) -> Dict[str, Any]:
    """Generate a validated fake headline item for a given round."""
    has_key = bool(
        api_key
        or os.getenv("AI_API_KEY")
        or os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or os.getenv("OPENAI_API_KEY")
        or os.getenv("ANTHROPIC_API_KEY")
        or os.getenv("META_API_KEY")
        or os.getenv("GROQ_API_KEY")
    )
    if dry_run or not has_key:
        # Pick from fixture fakes
        avail = [f for f in FIXTURE_FAKES if not exclude or f not in exclude]
        if not avail:
            avail = FIXTURE_FAKES
        idx = (round_number - 1) % len(avail)
        headline = avail[idx]
        return {"t": headline, "real": False, "s": FAKE_SOURCE_TEXT}

    headline = call_anthropic_generate_fake(
        round_real_stories=round_real_stories,
        round_number=round_number,
        exclude=exclude,
        api_key=api_key,
        model=model,
    )

    return {"t": headline, "real": False, "s": FAKE_SOURCE_TEXT}


def assemble_round(
    real_stories: List[Dict[str, Any]],
    fake_story: Dict[str, Any],
    shuffle: bool = True,
    seed: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Assemble a single round of 4 items (3 real, 1 fake) and shuffle."""
    if len(real_stories) != 3:
        raise ValueError(f"Expected exactly 3 real stories per round, got {len(real_stories)}")

    items = [dict(s) for s in real_stories] + [dict(fake_story)]

    if shuffle:
        rng = random.Random(seed) if seed is not None else random.Random()
        rng.shuffle(items)

    return items
