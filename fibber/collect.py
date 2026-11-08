from __future__ import annotations

import dataclasses
import datetime
import difflib
import email.utils
import html
import json
import logging
import os
import re
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from typing import Any, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)

DEFAULT_USER_AGENT = "FibberBot/1.0 (daily-game; contact: fibber-admin@users.noreply.github.com)"
MAX_AGE_DAYS = 14
DEFAULT_SIMILARITY_THRESHOLD = 0.65

REDDIT_FEEDS = [
    ("https://www.reddit.com/r/nottheonion/top.json?t=month&limit=50", "Reddit r/nottheonion"),
    ("https://www.reddit.com/r/FloridaMan/top.json?t=month&limit=50", "Reddit r/FloridaMan"),
    ("https://www.reddit.com/r/offbeat/top.json?t=month&limit=50", "Reddit r/offbeat"),
]

RSS_FEEDS = [
    ("https://www.upi.com/rss/Odd_News/", "UPI Odd News"),
    ("https://www.huffpost.com/section/weird-news/feed", "HuffPost Weird News"),
]


@dataclasses.dataclass
class CandidateStory:
    title: str
    url: str
    source: str
    published_at: str  # ISO 8601 string or YYYY-MM-DD
    summary: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return dataclasses.asdict(self)


def normalize_title(title: str) -> str:
    """Clean and unescape title, stripping outlet watermarks and tags."""
    if not title:
        return ""
    t = html.unescape(title).strip()
    # Remove Reddit tags like [r/nottheonion] or flair prefixes
    t = re.sub(r"^\[.*?\]\s*", "", t)
    t = re.sub(r"^\(.*?\)\s*", "", t)
    # Remove common feed suffixes
    t = re.sub(r"\s*[-–—|]\s*(UPI\.com|HuffPost|AP News|Reuters|The Guardian|BBC News|CNN)$", "", t, flags=re.IGNORECASE)
    # Strip redundant quotes and spaces
    t = re.sub(r"[\s\xa0]+", " ", t).strip()
    return t


def title_token_signature(title: str) -> str:
    """Return a normalized lowercased string without punctuation for similarity comparison."""
    norm = normalize_title(title).lower()
    return re.sub(r"[^\w\s]", "", norm).strip()


def compute_title_similarity(title_a: str, title_b: str) -> float:
    """
    Compute title similarity between 0.0 and 1.0 using sequence matching
    and word-level token overlap (Jaccard).
    """
    sig_a = title_token_signature(title_a)
    sig_b = title_token_signature(title_b)

    if not sig_a or not sig_b:
        return 0.0
    if sig_a == sig_b:
        return 1.0

    seq_ratio = difflib.SequenceMatcher(None, sig_a, sig_b).ratio()

    words_a = set(sig_a.split())
    words_b = set(sig_b.split())
    if words_a and words_b:
        jaccard = len(words_a & words_b) / len(words_a | words_b)
    else:
        jaccard = 0.0

    return max(seq_ratio, jaccard)


def is_within_age(pub_date: datetime.datetime, now: Optional[datetime.datetime] = None, max_days: int = MAX_AGE_DAYS) -> bool:
    """Check if the publication date is within the allowed age limit."""
    if now is None:
        now = datetime.datetime.now(datetime.timezone.utc)
    if pub_date.tzinfo is None:
        pub_date = pub_date.replace(tzinfo=datetime.timezone.utc)
    cutoff = now - datetime.timedelta(days=max_days)
    return pub_date >= cutoff


def parse_pub_date(raw_date: Any) -> Optional[datetime.datetime]:
    """Parse various date representations (UNIX timestamp, RFC 2822, ISO 8601)."""
    if isinstance(raw_date, (int, float)):
        return datetime.datetime.fromtimestamp(raw_date, tz=datetime.timezone.utc)
    if isinstance(raw_date, str):
        raw_str = raw_date.strip()
        # Try RFC 2822 format (common in RSS)
        try:
            parsed_tuple = email.utils.parsedate_to_datetime(raw_str)
            if parsed_tuple:
                return parsed_tuple
        except Exception:
            pass
        # Try ISO 8601 format
        try:
            return datetime.datetime.fromisoformat(raw_str.replace("Z", "+00:00"))
        except Exception:
            pass
        # Common RSS string formats
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%a, %d %b %Y %H:%M:%S %z", "%a, %d %b %Y %H:%M:%S %Z"):
            try:
                dt = datetime.datetime.strptime(raw_str, fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=datetime.timezone.utc)
                return dt
            except Exception:
                continue
    return None


def fetch_url_with_retry(
    url: str,
    user_agent: str = DEFAULT_USER_AGENT,
    max_retries: int = 3,
    backoff_seconds: float = 1.5,
    timeout: float = 12.0,
) -> Optional[str]:
    """Fetch URL with exponential backoff on transient errors and respectful headers."""
    headers = {
        "User-Agent": user_agent,
        "Accept": "application/json, application/rss+xml, application/xml, text/xml, */*",
    }
    req = urllib.request.Request(url, headers=headers)

    for attempt in range(1, max_retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                charset = response.headers.get_content_charset() or "utf-8"
                return response.read().decode(charset, errors="replace")
        except urllib.error.HTTPError as e:
            # 429 Too Many Requests or 5xx server errors warrant a retry
            if e.code in (429, 500, 502, 503, 504) and attempt < max_retries:
                sleep_time = backoff_seconds * (2 ** (attempt - 1))
                logger.warning("HTTP %d for %s. Retrying in %.1fs (attempt %d/%d)...", e.code, url, sleep_time, attempt, max_retries)
                time.sleep(sleep_time)
            else:
                logger.warning("HTTP error %d fetching %s: %s", e.code, url, e)
                return None
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            if attempt < max_retries:
                sleep_time = backoff_seconds * (2 ** (attempt - 1))
                logger.warning("Network error fetching %s: %s. Retrying in %.1fs...", url, e, sleep_time)
                time.sleep(sleep_time)
            else:
                logger.warning("Failed fetching %s after %d attempts: %s", url, max_retries, e)
                return None
    return None


def parse_reddit_json(raw_json: str, source_label: str, now: Optional[datetime.datetime] = None) -> List[CandidateStory]:
    """Parse Reddit public listing JSON into CandidateStory objects."""
    stories: List[CandidateStory] = []
    try:
        data = json.loads(raw_json)
        children = data.get("data", {}).get("children", [])
        for item in children:
            post = item.get("data", {})
            title = post.get("title", "")
            url = post.get("url") or f"https://reddit.com{post.get('permalink', '')}"
            created_utc = post.get("created_utc")

            # Skip self-posts without external link or NSFW posts if flagged
            if post.get("over_18", False) or post.get("is_self", False):
                continue

            dt = parse_pub_date(created_utc)
            if dt and not is_within_age(dt, now):
                continue

            clean_title = normalize_title(title)
            if len(clean_title) < 15:
                continue

            stories.append(
                CandidateStory(
                    title=clean_title,
                    url=url,
                    source=source_label,
                    published_at=dt.isoformat() if dt else datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    summary=post.get("selftext", "")[:300],
                )
            )
    except Exception as e:
        logger.error("Error parsing Reddit JSON for %s: %s", source_label, e)
    return stories


def parse_rss_xml(raw_xml: str, source_label: str, now: Optional[datetime.datetime] = None) -> List[CandidateStory]:
    """Parse RSS 2.0 XML into CandidateStory objects using ElementTree."""
    stories: List[CandidateStory] = []
    try:
        root = ET.fromstring(raw_xml)
        for item in root.findall(".//item"):
            title_node = item.find("title")
            link_node = item.find("link")
            pub_date_node = item.find("pubDate")
            desc_node = item.find("description")

            title = title_node.text if title_node is not None and title_node.text else ""
            link = link_node.text if link_node is not None and link_node.text else ""
            pub_date_raw = pub_date_node.text if pub_date_node is not None else ""
            desc = desc_node.text if desc_node is not None and desc_node.text else ""

            dt = parse_pub_date(pub_date_raw)
            if dt and not is_within_age(dt, now):
                continue

            clean_title = normalize_title(title)
            if len(clean_title) < 15:
                continue

            stories.append(
                CandidateStory(
                    title=clean_title,
                    url=link.strip(),
                    source=source_label,
                    published_at=dt.isoformat() if dt else datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    summary=html.unescape(re.sub(r"<[^>]+>", "", desc))[:300].strip(),
                )
            )
    except Exception as e:
        logger.error("Error parsing RSS XML for %s: %s", source_label, e)
    return stories


def load_used_history(filepath: str = "used.json") -> List[Dict[str, Any]]:
    """Load previously used stories from used.json."""
    if not os.path.exists(filepath):
        return []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
    except Exception as e:
        logger.warning("Could not read %s, starting fresh: %s", filepath, e)
    return []


def save_used_history(filepath: str, new_stories: List[Dict[str, Any]], max_entries: int = 1500) -> None:
    """Save used history, keeping the most recent max_entries."""
    existing = load_used_history(filepath)
    combined = new_stories + existing
    # Deduplicate entries by normalized title signature
    seen_sigs: Set[str] = set()
    pruned: List[Dict[str, Any]] = []
    for item in combined:
        title = item.get("t") or item.get("title") or ""
        sig = title_token_signature(title)
        if sig and sig not in seen_sigs:
            seen_sigs.add(sig)
            pruned.append(item)
        if len(pruned) >= max_entries:
            break

    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(pruned, f, indent=2, ensure_ascii=False)


def is_title_in_used(title: str, used_history: List[Dict[str, Any]], threshold: float = DEFAULT_SIMILARITY_THRESHOLD) -> bool:
    """Check if title matches any entry in used.json above similarity threshold."""
    for entry in used_history:
        prev_title = entry.get("t") or entry.get("title") or ""
        if compute_title_similarity(title, prev_title) >= threshold:
            return True
    return False


def deduplicate_candidates(
    candidates: List[CandidateStory],
    used_history: Optional[List[Dict[str, Any]]] = None,
    threshold: float = DEFAULT_SIMILARITY_THRESHOLD,
) -> List[CandidateStory]:
    """
    Deduplicate candidates against used history and against each other.
    Keeps the first occurrence of similar stories.
    """
    if used_history is None:
        used_history = []

    unique: List[CandidateStory] = []

    for cand in candidates:
        # Check against used history
        if is_title_in_used(cand.title, used_history, threshold=threshold):
            continue

        # Check against already selected in this batch
        is_dup = False
        for selected in unique:
            if compute_title_similarity(cand.title, selected.title) >= threshold:
                is_dup = True
                break

        if not is_dup:
            unique.append(cand)

    return unique


# Built-in fixture candidates for --dry-run and offline testing
FIXTURE_CANDIDATES = [
    CandidateStory(
        title="Florida man arrested after trying to pay for McDonald's with a bag of weed at drive-thru",
        url="https://example.com/florida-weed-mcdonalds",
        source="Reddit r/FloridaMan",
        published_at="2026-11-01T10:00:00+00:00",
        summary="A Florida man was taken into custody after attempting to trade marijuana for fast food.",
    ),
    CandidateStory(
        title="Penguin knighted by Norwegian King's Guard receives promotion to major general",
        url="https://example.com/penguin-knighted",
        source="UPI Odd News",
        published_at="2026-11-02T12:00:00+00:00",
        summary="Sir Nils Olav, Edinburgh Zoo resident king penguin, received another military decoration.",
    ),
    CandidateStory(
        title="Cat in Alaska served as honorary mayor of Talkeetna for two decades",
        url="https://example.com/stubbs-cat-mayor",
        source="Reddit r/offbeat",
        published_at="2026-11-03T09:00:00+00:00",
        summary="Stubbs the cat was elected honorary mayor of the small town in 1997.",
    ),
    CandidateStory(
        title="Minnesota town re-elects Duke the dog as mayor for fourth consecutive term",
        url="https://example.com/duke-dog-mayor",
        source="UPI Odd News",
        published_at="2026-11-04T15:00:00+00:00",
        summary="Duke the Great Pyrenees won reelection in Cormorant, Minnesota.",
    ),
    CandidateStory(
        title="Museum exhibits piece of 130-tonne fatberg that blocked London underground sewer",
        url="https://example.com/fatberg-museum",
        source="Reddit r/nottheonion",
        published_at="2026-11-05T14:00:00+00:00",
        summary="The Museum of London preserved a slice of the Whitechapel fatberg.",
    ),
    CandidateStory(
        title="Australian army was once defeated in military operation against thousands of emus",
        url="https://example.com/great-emu-war",
        source="Reddit r/offbeat",
        published_at="2026-11-05T18:00:00+00:00",
        summary="The 1932 Great Emu War saw soldiers withdraw after flightless birds outmaneuvered them.",
    ),
    CandidateStory(
        title="Thieves siphon millions of dollars of maple syrup in massive Canadian reserve heist",
        url="https://example.com/maple-syrup-heist",
        source="UPI Odd News",
        published_at="2026-11-06T11:00:00+00:00",
        summary="Quebec authorities recovered thousands of stolen barrels of maple syrup.",
    ),
    CandidateStory(
        title="Laughter epidemic once forced dozens of Tanzanian schools to temporarily close down",
        url="https://example.com/tanganyika-laughter",
        source="Reddit r/offbeat",
        published_at="2026-11-06T16:00:00+00:00",
        summary="The 1962 phenomenon affected hundreds of students who could not stop laughing.",
    ),
    CandidateStory(
        title="Strasbourg residents danced uncontrollably in streets for days during 1518 outbreak",
        url="https://example.com/dancing-plague",
        source="Reddit r/nottheonion",
        published_at="2026-11-07T08:00:00+00:00",
        summary="The Dancing Plague of 1518 remains one of history's strangest social contagions.",
    ),
    CandidateStory(
        title="Zoo monkey takes smartphone from tourist and accidentally orders hundreds of groceries",
        url="https://example.com/monkey-orders-groceries",
        source="Reddit r/offbeat",
        published_at="2026-11-07T12:00:00+00:00",
        summary="The curious primate tapped on delivery app notifications while playing with phone.",
    ),
    CandidateStory(
        title="Runaway runaway inflatable moon sculpture rolls through busy city intersection during storm",
        url="https://example.com/giant-moon-escape",
        source="UPI Odd News",
        published_at="2026-11-07T19:00:00+00:00",
        summary="A giant festival moon broke free in Fuzhou and bounced down commuter lanes.",
    ),
    CandidateStory(
        title="Iceland road crew relocates boulder after locals warn it is home to hidden elves",
        url="https://example.com/elf-rock-iceland",
        source="Reddit r/nottheonion",
        published_at="2026-11-08T07:00:00+00:00",
        summary="Highway construction paused to negotiate with folklore experts over enchanted stone.",
    ),
]


def collect_all_candidates(
    dry_run: bool = False,
    used_history_file: str = "used.json",
    now: Optional[datetime.datetime] = None,
) -> List[CandidateStory]:
    """
    Fetch all weird news feeds, apply age filtering, deduplicate, and exclude used history.
    In dry-run or when feeds are unreachable, falls back to rich fixture data.
    """
    if dry_run:
        logger.info("Dry run mode: using fixture candidates.")
        used = load_used_history(used_history_file)
        return deduplicate_candidates(FIXTURE_CANDIDATES, used_history=used)

    raw_candidates: List[CandidateStory] = []

    # 1. Fetch Reddit JSON feeds
    for url, label in REDDIT_FEEDS:
        raw = fetch_url_with_retry(url)
        if raw:
            parsed = parse_reddit_json(raw, label, now=now)
            logger.info("Fetched %d stories from %s", len(parsed), label)
            raw_candidates.extend(parsed)

    # 2. Fetch RSS feeds
    for url, label in RSS_FEEDS:
        raw = fetch_url_with_retry(url)
        if raw:
            parsed = parse_rss_xml(raw, label, now=now)
            logger.info("Fetched %d stories from %s", len(parsed), label)
            raw_candidates.extend(parsed)

    # Fallback to fixtures if network feeds returned too few candidates
    if len(raw_candidates) < 9:
        logger.warning(
            "Only collected %d candidates from live feeds. Augmenting with fixture candidates.",
            len(raw_candidates),
        )
        raw_candidates.extend(FIXTURE_CANDIDATES)

    used_history = load_used_history(used_history_file)
    deduped = deduplicate_candidates(raw_candidates, used_history=used_history)
    logger.info("Collected %d unique candidates after deduplication and used check.", len(deduped))
    return deduped
