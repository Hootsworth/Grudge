from __future__ import annotations

import datetime
import json
import os
import shutil
import tempfile
import unittest

from fibber.main import (
    approve_puzzle,
    fallback_puzzle,
    format_puzzle_preview_markdown,
    prune_archive,
    run_pipeline,
)
from fibber.validate import assert_valid_puzzle


class TestPipeline(unittest.TestCase):

    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.pending_path = os.path.join(self.test_dir, "pending", "today.json")
        self.public_path = os.path.join(self.test_dir, "public", "today.json")
        self.root_path = os.path.join(self.test_dir, "today.json")
        self.archive_dir = os.path.join(self.test_dir, "archive")
        self.backlog_dir = os.path.join(self.test_dir, "backlog")
        self.used_file = os.path.join(self.test_dir, "used.json")

        os.makedirs(self.backlog_dir, exist_ok=True)

        # Seed sample backlog puzzle
        self.sample_backlog = {
            "date": "2026-01-01",
            "rounds": [
                [
                    {"t": "Town elects stray cat as honorary mayor for two decades", "real": True, "s": "Talkeetna, Alaska."},
                    {"t": "Library rents out retired librarians as search engines", "real": False, "s": "Invented for this puzzle."},
                    {"t": "A penguin receives military knighthood and promotion", "real": True, "s": "Edinburgh Zoo, Scotland."},
                    {"t": "Quebec maple syrup reserve loses millions in heist", "real": True, "s": "Quebec, Canada."},
                ],
                [
                    {"t": "Residents dance uncontrollably in street during epidemic", "real": True, "s": "Strasbourg, 1518."},
                    {"t": "Town fines residents who do not wave at snowplows", "real": False, "s": "Invented for this puzzle."},
                    {"t": "Laughter epidemic forces region schools to close down", "real": True, "s": "Tanzania, 1962."},
                    {"t": "Soldiers fight emus with machine guns and lose war", "real": True, "s": "Western Australia, 1932."},
                ],
                [
                    {"t": "Driver throws live alligator through fast food window", "real": True, "s": "Lake City, Florida, 2016."},
                    {"t": "Railway offers free tickets for bringing sourdough", "real": False, "s": "Invented for this puzzle."},
                    {"t": "Town elects Great Pyrenees dog as mayor repeatedly", "real": True, "s": "Cormorant, Minnesota."},
                    {"t": "Massive sewer fatberg gets displayed in city museum", "real": True, "s": "London, 2017."},
                ],
            ],
        }
        with open(os.path.join(self.backlog_dir, "puzzle_01.json"), "w", encoding="utf-8") as f:
            json.dump(self.sample_backlog, f)

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_dry_run_pipeline_end_to_end(self):
        target_date = "2026-11-08"
        puzzle = run_pipeline(
            date_str=target_date,
            dry_run=True,
            pending_path=self.pending_path,
            archive_dir=self.archive_dir,
            used_file=self.used_file,
        )

        # 1. Output structure check
        self.assertEqual(puzzle["date"], target_date)
        self.assertEqual(len(puzzle["rounds"]), 3)

        for round_items in puzzle["rounds"]:
            self.assertEqual(len(round_items), 4)
            fake_count = sum(1 for item in round_items if not item["real"])
            self.assertEqual(fake_count, 1)
            for item in round_items:
                self.assertLessEqual(len(item["t"]), 110)
                self.assertTrue(item["t"].strip())
                self.assertTrue(item["s"].strip())
                if not item["real"]:
                    self.assertEqual(item["s"], "Invented for this puzzle.")

        # 2. File written checks
        self.assertTrue(os.path.exists(self.pending_path))
        with open(self.pending_path, "r", encoding="utf-8") as f:
            saved_pending = json.load(f)
        assert_valid_puzzle(saved_pending)

        archive_path = os.path.join(self.archive_dir, f"{target_date}.json")
        self.assertTrue(os.path.exists(archive_path))

        self.assertTrue(os.path.exists(self.used_file))

    def test_approve_puzzle(self):
        # Create valid pending file
        os.makedirs(os.path.dirname(self.pending_path), exist_ok=True)
        with open(self.pending_path, "w", encoding="utf-8") as f:
            json.dump(self.sample_backlog, f)

        approve_puzzle(
            pending_path=self.pending_path,
            public_path=self.public_path,
            root_path=self.root_path,
        )

        self.assertTrue(os.path.exists(self.public_path))
        self.assertTrue(os.path.exists(self.root_path))
        with open(self.public_path, "r", encoding="utf-8") as f:
            pub_data = json.load(f)
        assert_valid_puzzle(pub_data)

    def test_fallback_puzzle(self):
        fallback_date = "2026-11-09"
        fallback_puzzle(
            date_str=fallback_date,
            backlog_dir=self.backlog_dir,
            public_path=self.public_path,
            root_path=self.root_path,
        )

        self.assertTrue(os.path.exists(self.public_path))
        with open(self.public_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(data["date"], fallback_date)
        assert_valid_puzzle(data)

    def test_prune_archive(self):
        now = datetime.datetime(2026, 11, 20, 12, 0, 0, tzinfo=datetime.timezone.utc)
        os.makedirs(self.archive_dir, exist_ok=True)

        recent_file = os.path.join(self.archive_dir, "2026-11-15.json")
        old_file = os.path.join(self.archive_dir, "2026-11-01.json")  # 19 days old

        with open(recent_file, "w") as f:
            f.write("{}")
        with open(old_file, "w") as f:
            f.write("{}")

        prune_archive(self.archive_dir, keep_days=14, now=now)

        self.assertTrue(os.path.exists(recent_file))
        self.assertFalse(os.path.exists(old_file))

    def test_format_puzzle_preview_markdown(self):
        preview = format_puzzle_preview_markdown(self.sample_backlog)
        self.assertIn("Fibber Daily Puzzle Review", preview)
        self.assertIn("Round 1", preview)
        self.assertIn("Round 2", preview)
        self.assertIn("Round 3", preview)
        self.assertIn("[FAKE]", preview)
        self.assertIn("[REAL]", preview)


if __name__ == "__main__":
    unittest.main()
