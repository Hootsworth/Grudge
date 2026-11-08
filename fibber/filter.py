from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Dict, List, Optional

from fibber.collect import CandidateStory

logger = logging.getLogger(__name__)

DEFAULT_ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
MAX_HEADLINE_LENGTH = 110


FILTER_SYSTEM_PROMPT = """You are the lead editor for "Fibber", a daily comedy news game.
Your task is to review candidate weird news stories, select the top 9 funniest and most surprising stories, and rewrite them into crisp, neutral headlines.

CRITICAL SAFETY & CONTENT RULES:
- REJECT any story involving human death, injury, violence against people, murder, suicide, war, or physical harm.
- REJECT any story involving children, minors, or sexual content/crimes.
- REJECT stories identifying private individuals in embarrassing legal trouble unless it is world-famous absurd folklore (e.g. Florida man alligator drive-thru). Never mock private victims.
- PREFER absurd, harmless, whimsical, bizarre, or bureaucratic oddities (e.g. animals with jobs, food heists, bizarre ordinances, accidental deliveries, weird festivals).

REWRITE RULES:
- Rewrite each chosen story's headline in OUR OWN WORDS. NEVER copy the original headline text.
- Tone: Neutral, matter-of-fact, deadpan comedy.
- Length: STRICTLY under 110 characters. (Aim for 50-95 characters).
- Credit line ("s"): Write a concise one-line credit specifying the location, year/date, and outlet or context (e.g., "Lake City, Florida, 2016. Widely reported." or "Edinburgh Zoo, 2023. UPI Odd News.").

OUTPUT FORMAT:
Return ONLY a valid JSON array containing exactly 9 objects. No markdown formatting, no commentary:
[
  {
    "original_title": "Original headline string",
    "t": "Rewritten headline under 110 characters",
    "s": "Location, Year. Outlet/Context."
  },
  ...
]"""


def call_anthropic_filter(
    candidates: List[CandidateStory],
    api_key: Optional[str] = None,
    model: str = DEFAULT_ANTHROPIC_MODEL,
) -> List[Dict[str, Any]]:
    """Send candidates to Anthropic API to select and rewrite 9 stories."""
    if not api_key:
        api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY is not set.")

    try:
        import anthropic
    except ImportError as e:
        raise ImportError("anthropic package is required for live filtering. Run: pip install anthropic") from e

    # Format candidates list for prompt
    candidates_data = [
        {
            "index": idx + 1,
            "title": c.title,
            "source": c.source,
            "published_at": c.published_at,
            "summary": c.summary,
        }
        for idx, c in enumerate(candidates[:60])
    ]

    user_prompt = (
        f"Review these {len(candidates_data)} candidate news stories.\n"
        "Select the 9 funniest, safest, and most absurd stories. Rewrite each into a neutral headline "
        "(STRICTLY under 110 characters) and provide the 's' credit line.\n\n"
        f"Candidate Stories:\n{json.dumps(candidates_data, indent=2)}\n\n"
        "Return the 9 selected stories as a JSON array matching the specified format."
    )

    client = anthropic.Anthropic(api_key=api_key)
    logger.info("Calling Anthropic API (%s) to filter and rewrite %d candidates...", model, len(candidates_data))

    response = client.messages.create(
        model=model,
        max_tokens=2048,
        temperature=0.3,
        system=FILTER_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    # Extract JSON text
    content_text = ""
    for block in response.content:
        if getattr(block, "type", "") == "text":
            content_text += block.text

    # Strip code block wrappers if any
    cleaned_json = re.sub(r"^```(?:json)?\s*", "", content_text.strip(), flags=re.MULTILINE)
    cleaned_json = re.sub(r"\s*```$", "", cleaned_json, flags=re.MULTILINE)

    parsed = json.loads(cleaned_json)
    if not isinstance(parsed, list):
        raise ValueError("Model did not return a JSON array.")

    results: List[Dict[str, Any]] = []
    for item in parsed:
        t = item.get("t", "").strip()
        s = item.get("s", "").strip()
        if len(t) > MAX_HEADLINE_LENGTH:
            # Enforce max length safely
            t = t[:MAX_HEADLINE_LENGTH].rsplit(" ", 1)[0].rstrip(",.- ")
        results.append({"t": t, "real": True, "s": s})

    if len(results) < 9:
        raise ValueError(f"Model returned only {len(results)} stories, needed at least 9.")

    return results[:9]


def get_mock_filtered_stories() -> List[Dict[str, Any]]:
    """Return 9 pre-filtered real stories for dry-run and offline tests."""
    return [
        {
            "t": "Florida man hurls a live alligator through a Wendy’s drive-thru window",
            "real": True,
            "s": "Lake City, Florida, 2016. Widely reported.",
        },
        {
            "t": "Australia sends soldiers with machine guns to fight emus, and loses",
            "real": True,
            "s": "The Great Emu War, Western Australia, 1932.",
        },
        {
            "t": "A Minnesota town elects a dog as its mayor",
            "real": True,
            "s": "Cormorant, Minnesota elected Duke the dog in 2014.",
        },
        {
            "t": "A penguin is knighted by the Norwegian King’s Guard",
            "real": True,
            "s": "Sir Nils Olav, Edinburgh Zoo’s king penguin, holds rank of brigadier.",
        },
        {
            "t": "Thieves steal millions of dollars of maple syrup from a Quebec reserve",
            "real": True,
            "s": "The Great Canadian Maple Syrup Heist, 2011 to 2012.",
        },
        {
            "t": "A laughter epidemic closes schools across a region of Tanzania",
            "real": True,
            "s": "The 1962 Tanganyika laughter epidemic.",
        },
        {
            "t": "Alaska town keeps a cat as honorary mayor for two decades",
            "real": True,
            "s": "Stubbs of Talkeetna, Alaska.",
        },
        {
            "t": "A 130-tonne fatberg clogs a London sewer, and gets put in a museum",
            "real": True,
            "s": "Whitechapel, 2017. A chunk went to the Museum of London.",
        },
        {
            "t": "Hundreds of people dance for days in a French city and cannot stop",
            "real": True,
            "s": "The Dancing Plague of 1518, Strasbourg.",
        },
    ]


def filter_and_rewrite_stories(
    candidates: List[CandidateStory],
    dry_run: bool = False,
    api_key: Optional[str] = None,
    model: str = DEFAULT_ANTHROPIC_MODEL,
) -> List[Dict[str, Any]]:
    """Filter candidates and return 9 rewritten real stories."""
    if dry_run or not (api_key or os.getenv("ANTHROPIC_API_KEY")):
        logger.info("Using mock/fixture filtered stories (dry-run or no Anthropic key).")
        return get_mock_filtered_stories()

    try:
        return call_anthropic_filter(candidates, api_key=api_key, model=model)
    except Exception as e:
        logger.warning("Anthropic filter call failed (%s). Falling back to fixture stories.", e)
        if dry_run:
            return get_mock_filtered_stories()
        raise
