from __future__ import annotations

import argparse
import datetime
import json
import logging
import os
import shutil
import sys
from typing import Any, Dict, List, Optional

from fibber.collect import (
    collect_all_candidates,
    load_used_history,
    save_used_history,
)
from fibber.filter import filter_and_rewrite_stories
from fibber.generate import assemble_round
from fibber.validate import assert_valid_puzzle
from fibber.verify import verify_and_ensure_fake

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("fibber")


def prune_archive(archive_dir: str, keep_days: int = 14, now: Optional[datetime.datetime] = None) -> None:
    """Remove archive files older than keep_days."""
    if not os.path.exists(archive_dir):
        return

    if now is None:
        now = datetime.datetime.now(datetime.timezone.utc)

    cutoff_date = (now - datetime.timedelta(days=keep_days)).date()

    for filename in os.listdir(archive_dir):
        if not filename.endswith(".json"):
            continue
        stem = filename[:-5]
        try:
            file_date = datetime.date.fromisoformat(stem)
            if file_date < cutoff_date:
                full_path = os.path.join(archive_dir, filename)
                os.remove(full_path)
                logger.info("Pruned old archive file: %s", full_path)
        except ValueError:
            # Ignore files that don't match YYYY-MM-DD
            continue


def format_puzzle_preview_markdown(puzzle: Dict[str, Any]) -> str:
    """Generate a clean, readable GitHub issue preview markdown for human review."""
    date_str = puzzle.get("date", "Unknown Date")
    rounds = puzzle.get("rounds", [])

    lines = [
        f"## 🧩 Fibber Daily Puzzle Review: `{date_str}`",
        "",
        "> Please review today's generated headlines. Check tone, humor, and ensure the fake is convincing.",
        "",
        "### Review Checklist",
        "- [ ] No named living private individuals in embarrassing situations",
        "- [ ] No violence against humans, death, injury, or sexual content",
        "- [ ] Tone is funny, dry, and harmless",
        "- [ ] Fake headline blends seamlessly with the real ones",
        "",
    ]

    for round_idx, round_items in enumerate(rounds):
        round_num = round_idx + 1
        lines.append(f"### Round {round_num}")
        lines.append("")
        for item_idx, item in enumerate(round_items):
            letter = chr(65 + item_idx)
            is_fake = not item.get("real", True)
            headline = item.get("t", "")
            source = item.get("s", "")
            tag = "❌ **[FAKE]**" if is_fake else "✅ [REAL]"
            lines.append(f"- **{letter})** {headline} ({len(headline)} chars)")
            lines.append(f"  * {tag} `{source}`")
        lines.append("")

    lines.extend([
        "---",
        "### How to Approve",
        "- Label this issue with `approved`, OR",
        "- Run the **Daily Pipeline** workflow with input action `approve`.",
        "",
        "_If no approval is granted by **06:00 UTC**, the pipeline will automatically fall back to a pre-approved backlog puzzle._",
    ])

    return "\n".join(lines)


def run_pipeline(
    date_str: str,
    dry_run: bool = False,
    pending_path: str = "pending/today.json",
    archive_dir: str = "archive",
    used_file: str = "used.json",
    anthropic_api_key: Optional[str] = None,
    search_api_key: Optional[str] = None,
    search_provider: Optional[str] = None,
    ai_provider: Optional[str] = None,
    ai_model: Optional[str] = None,
) -> Dict[str, Any]:
    """Execute the full 6-step generation pipeline and save to pending."""
    logger.info("Starting Fibber generation pipeline for date: %s (dry_run=%s)", date_str, dry_run)

    # Step 1: Collect candidates
    candidates = collect_all_candidates(dry_run=dry_run, used_history_file=used_file)
    logger.info("Collected %d candidate stories.", len(candidates))

    # Step 2 & 3: Filter and rewrite 9 real stories
    real_stories = filter_and_rewrite_stories(
        candidates,
        dry_run=dry_run,
        api_key=anthropic_api_key,
        model=ai_model,
    )
    logger.info("Selected and rewritten %d real stories.", len(real_stories))

    # Split into 3 rounds of 3 stories
    rounds_real = [
        real_stories[0:3],
        real_stories[3:6],
        real_stories[6:9],
    ]

    puzzle_rounds: List[List[Dict[str, Any]]] = []

    # Step 4 & 5: Generate and verify fake for each round, assemble & shuffle
    for round_idx, round_real in enumerate(rounds_real):
        round_num = round_idx + 1
        fake_story = verify_and_ensure_fake(
            round_real_stories=round_real,
            round_number=round_num,
            dry_run=dry_run,
            anthropic_api_key=anthropic_api_key,
            search_api_key=search_api_key,
            search_provider=search_provider,
            model=ai_model,
        )
        round_items = assemble_round(round_real, fake_story, shuffle=True)
        puzzle_rounds.append(round_items)

    puzzle: Dict[str, Any] = {
        "date": date_str,
        "rounds": puzzle_rounds,
    }

    # Step 6: Validate schema and constraints strictly
    logger.info("Validating generated puzzle against strict specifications...")
    assert_valid_puzzle(puzzle)
    logger.info("Validation PASSED.")

    # Step 7: Write to pending/today.json
    os.makedirs(os.path.dirname(os.path.abspath(pending_path)), exist_ok=True)
    with open(pending_path, "w", encoding="utf-8") as f:
        json.dump(puzzle, f, indent=2, ensure_ascii=False)
    logger.info("Wrote pending puzzle to: %s", pending_path)

    # Step 8: Save to archive/{date}.json and prune archive > 14 days
    os.makedirs(archive_dir, exist_ok=True)
    archive_file = os.path.join(archive_dir, f"{date_str}.json")
    with open(archive_file, "w", encoding="utf-8") as f:
        json.dump(puzzle, f, indent=2, ensure_ascii=False)
    logger.info("Saved archive copy to: %s", archive_file)
    prune_archive(archive_dir=archive_dir, keep_days=14)

    # Update used.json history with the 9 real stories
    save_used_history(used_file, real_stories)
    logger.info("Updated used history file: %s", used_file)

    return puzzle


def approve_puzzle(
    pending_path: str = "pending/today.json",
    public_path: str = "public/today.json",
    root_path: Optional[str] = "today.json",
) -> None:
    """Copy approved puzzle from pending/today.json to public/today.json."""
    if not os.path.exists(pending_path):
        raise FileNotFoundError(f"Cannot approve: '{pending_path}' does not exist.")

    with open(pending_path, "r", encoding="utf-8") as f:
        puzzle = json.load(f)

    assert_valid_puzzle(puzzle)

    os.makedirs(os.path.dirname(os.path.abspath(public_path)), exist_ok=True)
    shutil.copyfile(pending_path, public_path)
    logger.info("Approved puzzle published to %s", public_path)

    # Also update root today.json if present or requested
    if root_path:
        shutil.copyfile(pending_path, root_path)
        logger.info("Also synced to root %s", root_path)


def fallback_puzzle(
    date_str: str,
    backlog_dir: str = "backlog",
    public_path: str = "public/today.json",
    root_path: Optional[str] = "today.json",
) -> None:
    """Select a pre-approved puzzle from backlog/, stamp with date_str, and deploy."""
    if not os.path.exists(backlog_dir):
        raise FileNotFoundError(f"Backlog directory '{backlog_dir}' does not exist.")

    backlog_files = sorted([f for f in os.listdir(backlog_dir) if f.endswith(".json")])
    if not backlog_files:
        raise FileNotFoundError(f"No backlog puzzle files found in '{backlog_dir}'.")

    # Pick first available backlog file
    selected_file = os.path.join(backlog_dir, backlog_files[0])
    with open(selected_file, "r", encoding="utf-8") as f:
        puzzle = json.load(f)

    # Stamp with target date
    puzzle["date"] = date_str
    assert_valid_puzzle(puzzle)

    os.makedirs(os.path.dirname(os.path.abspath(public_path)), exist_ok=True)
    with open(public_path, "w", encoding="utf-8") as f:
        json.dump(puzzle, f, indent=2, ensure_ascii=False)
    logger.info("Deployed fallback puzzle from %s to %s", selected_file, public_path)

    if root_path:
        with open(root_path, "w", encoding="utf-8") as f:
            json.dump(puzzle, f, indent=2, ensure_ascii=False)
        logger.info("Also synced fallback puzzle to %s", root_path)


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fibber Daily Puzzle Backend Pipeline")
    parser.add_argument("--dry-run", action="store_true", help="Run offline with fixture data (no API keys required)")
    parser.add_argument("--date", type=str, default=None, help="Target date YYYY-MM-DD (defaults to UTC today)")
    parser.add_argument("--pending-path", type=str, default="pending/today.json", help="Path to pending today.json")
    parser.add_argument("--public-path", type=str, default="public/today.json", help="Path to public today.json")
    parser.add_argument("--archive-dir", type=str, default="archive", help="Directory for 14-day archive")
    parser.add_argument("--backlog-dir", type=str, default="backlog", help="Directory for pre-approved backlog puzzles")
    parser.add_argument("--used-file", type=str, default="used.json", help="Path to used stories history file")
    parser.add_argument("--approve", action="store_true", help="Approve pending/today.json and copy to public/today.json")
    parser.add_argument("--fallback", action="store_true", help="Deploy pre-approved backlog puzzle to public/today.json")
    parser.add_argument("--format-preview", action="store_true", help="Print Markdown preview of pending puzzle")
    parser.add_argument("--provider", type=str, default=None, help="AI Provider: gemini, openai, anthropic, meta, groq, together")
    parser.add_argument("--model", type=str, default=None, help="AI Model override (e.g. gemini-2.0-flash, gpt-4o)")
    return parser


def main() -> None:
    parser = build_arg_parser()
    args = parser.parse_args()

    date_str = args.date or datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")

    try:
        if args.approve:
            approve_puzzle(pending_path=args.pending_path, public_path=args.public_path)
            print(f"Successfully approved and published puzzle to {args.public_path}")
            return

        if args.fallback:
            fallback_puzzle(date_str=date_str, backlog_dir=args.backlog_dir, public_path=args.public_path)
            print(f"Successfully deployed fallback puzzle for {date_str} to {args.public_path}")
            return

        if args.format_preview:
            if not os.path.exists(args.pending_path):
                print(f"Error: {args.pending_path} does not exist", file=sys.stderr)
                sys.exit(1)
            with open(args.pending_path, "r", encoding="utf-8") as f:
                puzzle = json.load(f)
            print(format_puzzle_preview_markdown(puzzle))
            return

        # Default action: run generation pipeline
        puzzle = run_pipeline(
            date_str=date_str,
            dry_run=args.dry_run,
            pending_path=args.pending_path,
            archive_dir=args.archive_dir,
            used_file=args.used_file,
            ai_provider=args.provider,
            ai_model=args.model,
        )

        print("\n" + "=" * 60)
        print(f"✅ Fibber puzzle generated and validated successfully for {date_str}!")
        print("=" * 60)
        for r_idx, r_items in enumerate(puzzle["rounds"]):
            print(f"\n--- Round {r_idx + 1} ---")
            for item in r_items:
                marker = "[FAKE]" if not item["real"] else "[REAL]"
                print(f"  {marker:6} {item['t']}")
                print(f"         Source: {item['s']}")
        print("\n" + "=" * 60)

    except Exception as e:
        logger.exception("Pipeline failed: %s", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
