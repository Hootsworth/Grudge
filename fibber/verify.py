from __future__ import annotations

import json
import logging
import os
import re
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

DEFAULT_ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
MAX_VERIFICATION_ATTEMPTS = 3


def detect_search_provider(api_key: str, explicit_provider: Optional[str] = None) -> str:
    """Detect whether to use Tavily or Brave search based on provider or key pattern."""
    if explicit_provider:
        prov = explicit_provider.lower().strip()
        if prov in ("tavily", "brave"):
            return prov
    if api_key.startswith("tvly-"):
        return "tavily"
    if api_key.startswith("BSA"):
        return "brave"
    return "tavily"  # default


def search_tavily(query: str, api_key: str, max_results: int = 5, timeout: float = 10.0) -> List[Dict[str, str]]:
    """Execute search query using Tavily API."""
    url = "https://api.tavily.com/search"
    payload = {
        "api_key": api_key,
        "query": query,
        "search_depth": "basic",
        "max_results": max_results,
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "FibberVerifier/1.0"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        results = []
        for r in data.get("results", []):
            results.append({
                "title": r.get("title", ""),
                "snippet": r.get("content", ""),
                "url": r.get("url", ""),
            })
        return results


def search_brave(query: str, api_key: str, max_results: int = 5, timeout: float = 10.0) -> List[Dict[str, str]]:
    """Execute search query using Brave Search API."""
    params = urllib.parse.urlencode({"q": query, "count": max_results})
    url = f"https://api.search.brave.com/res/v1/web/search?{params}"
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "X-Subscription-Token": api_key,
            "User-Agent": "FibberVerifier/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        results = []
        for r in data.get("web", {}).get("results", []):
            results.append({
                "title": r.get("title", ""),
                "snippet": r.get("description", ""),
                "url": r.get("url", ""),
            })
        return results


def execute_web_search(
    query: str,
    api_key: Optional[str] = None,
    provider: Optional[str] = None,
) -> List[Dict[str, str]]:
    """Search web using configured provider (Tavily or Brave)."""
    if not api_key:
        api_key = os.getenv("SEARCH_API_KEY")

    if not api_key:
        logger.warning("SEARCH_API_KEY not provided. Skipping live web search.")
        return []

    active_provider = detect_search_provider(api_key, explicit_provider=provider or os.getenv("SEARCH_PROVIDER"))
    try:
        if active_provider == "brave":
            return search_brave(query, api_key)
        return search_tavily(query, api_key)
    except Exception as e:
        logger.warning("Search provider '%s' failed for query '%s': %s", active_provider, query, e)
        return []


VERIFY_SYSTEM_PROMPT = """You are a rigorous factual verifier for "Fibber", a game where players spot fake news headlines.
Your mission is to check if a supposedly FAKE headline accidentally describes an actual real-life news event.

You will be given:
1. The proposed fake headline.
2. Web search results from the internet.

DECISION CRITERIA:
- Set matches_real_story to true ONLY IF the search results show that the specific, core premise of this headline actually happened in the real world (e.g. a town actually passed that law, or an animal was actually knighted for that).
- Coincidental keyword matches (e.g. separate articles mentioning snowplows or drivers, or generic mentions of a city) do NOT count as a match. It must describe the actual story premise.
- Return JSON ONLY:
{
  "matches_real_story": true|false,
  "reason": "Brief explanation of the decision"
}"""


def check_fake_against_search_results(
    headline: str,
    search_results: List[Dict[str, str]],
    api_key: Optional[str] = None,
    model: str = DEFAULT_ANTHROPIC_MODEL,
) -> Tuple[bool, str]:
    """
    Use Anthropic model to check whether search results confirm this headline is real.
    Returns (matches_real_story, reason).
    """
    if not search_results:
        return False, "No search results found to contradict fake status."

    if not api_key:
        api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        return False, "Anthropic API key not provided; assuming fake is valid."

    try:
        import anthropic
    except ImportError:
        return False, "anthropic package not installed."

    snippets_text = "\n\n".join(
        f"Result {i+1}:\nTitle: {r['title']}\nSnippet: {r['snippet']}\nURL: {r['url']}"
        for i, r in enumerate(search_results)
    )

    user_prompt = (
        f"Proposed Fake Headline: \"{headline}\"\n\n"
        f"Search Results:\n{snippets_text}\n\n"
        "Does a real news story matching this specific headline premise exist? Return JSON."
    )

    client = anthropic.Anthropic(api_key=api_key)
    response = client.messages.create(
        model=model,
        max_tokens=256,
        temperature=0.0,
        system=VERIFY_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    content_text = ""
    for block in response.content:
        if getattr(block, "type", "") == "text":
            content_text += block.text

    cleaned_json = re.sub(r"^```(?:json)?\s*", "", content_text.strip(), flags=re.MULTILINE)
    cleaned_json = re.sub(r"\s*```$", "", cleaned_json, flags=re.MULTILINE)

    data = json.loads(cleaned_json)
    matches = bool(data.get("matches_real_story", False))
    reason = str(data.get("reason", ""))
    return matches, reason


def verify_and_ensure_fake(
    round_real_stories: List[Dict[str, Any]],
    round_number: int = 1,
    dry_run: bool = False,
    anthropic_api_key: Optional[str] = None,
    search_api_key: Optional[str] = None,
    search_provider: Optional[str] = None,
    model: str = DEFAULT_ANTHROPIC_MODEL,
) -> Dict[str, Any]:
    """
    Generate and verify a fake headline for a round.
    If search results reveal it's actually real, regenerate up to MAX_VERIFICATION_ATTEMPTS.
    """
    from fibber.generate import generate_fake_for_round

    if dry_run or not (anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")):
        logger.info("Dry-run / offline: generating fixture fake without live search verification.")
        return generate_fake_for_round(round_real_stories, round_number=round_number, dry_run=True)

    rejected_headlines: List[str] = []

    for attempt in range(1, MAX_VERIFICATION_ATTEMPTS + 1):
        candidate_fake = generate_fake_for_round(
            round_real_stories=round_real_stories,
            round_number=round_number,
            exclude=rejected_headlines,
            dry_run=False,
            api_key=anthropic_api_key,
            model=model,
        )

        headline = candidate_fake["t"]
        logger.info("Round %d verification (attempt %d/%d): checking '%s'...", round_number, attempt, MAX_VERIFICATION_ATTEMPTS, headline)

        # 1. Run web search
        search_results = execute_web_search(headline, api_key=search_api_key, provider=search_provider)

        # 2. Check if a real story matches
        is_real_match, reason = check_fake_against_search_results(
            headline=headline,
            search_results=search_results,
            api_key=anthropic_api_key,
            model=model,
        )

        if not is_real_match:
            logger.info("Round %d fake verified as fictional: '%s' (%s)", round_number, headline, reason)
            return candidate_fake

        logger.warning(
            "Fake headline '%s' matches a real event (%s)! Rejecting and regenerating...",
            headline,
            reason,
        )
        rejected_headlines.append(headline)

    logger.warning("Exceeded max verification attempts for Round %d; using latest candidate.", round_number)
    return candidate_fake
