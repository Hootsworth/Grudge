from __future__ import annotations

import copy
import unittest
from typing import Any, Dict

from fibber.validate import (
    MAX_HEADLINE_LENGTH,
    ValidationError,
    assert_valid_puzzle,
    validate_puzzle,
)


def make_valid_puzzle() -> Dict[str, Any]:
    return {
        "date": "2026-11-08",
        "rounds": [
            [
                {
                    "t": "Florida man hurls a live alligator through a Wendy’s window",
                    "real": True,
                    "s": "Lake City, Florida, 2016. Widely reported.",
                },
                {
                    "t": "Australia sends soldiers with machine guns to fight emus",
                    "real": True,
                    "s": "The Great Emu War, Western Australia, 1932.",
                },
                {
                    "t": "Vermont town fines residents who fail to wave at snowplows",
                    "real": False,
                    "s": "Invented for this puzzle.",
                },
                {
                    "t": "A Minnesota town elects a dog as its mayor",
                    "real": True,
                    "s": "Cormorant, Minnesota elected Duke the dog in 2014.",
                },
            ],
            [
                {
                    "t": "Dutch railway offers free tickets for bringing sourdough",
                    "real": False,
                    "s": "Invented for this puzzle.",
                },
                {
                    "t": "A penguin is knighted by the Norwegian King’s Guard",
                    "real": True,
                    "s": "Sir Nils Olav, Edinburgh Zoo’s king penguin.",
                },
                {
                    "t": "Thieves steal millions of dollars of maple syrup in Quebec",
                    "real": True,
                    "s": "The Great Canadian Maple Syrup Heist, 2011.",
                },
                {
                    "t": "A laughter epidemic closes schools across a region of Tanzania",
                    "real": True,
                    "s": "The 1962 Tanganyika laughter epidemic.",
                },
            ],
            [
                {
                    "t": "Ohio library begins lending out retired librarians as search engines",
                    "real": False,
                    "s": "Invented for this puzzle.",
                },
                {
                    "t": "Alaska town keeps a cat as honorary mayor for two decades",
                    "real": True,
                    "s": "Stubbs of Talkeetna, Alaska.",
                },
                {
                    "t": "A 130-tonne fatberg clogs a London sewer and enters museum",
                    "real": True,
                    "s": "Whitechapel, 2017. Museum of London.",
                },
                {
                    "t": "Hundreds of people dance for days in a French city uncontrollably",
                    "real": True,
                    "s": "The Dancing Plague of 1518, Strasbourg.",
                },
            ],
        ],
    }


class TestValidatePuzzle(unittest.TestCase):

    def test_valid_puzzle_passes(self):
        puzzle = make_valid_puzzle()
        is_valid, errors = validate_puzzle(puzzle)
        self.assertTrue(is_valid)
        self.assertEqual(errors, [])
        # assert_valid_puzzle should not raise
        assert_valid_puzzle(puzzle)

    def test_root_must_be_dict(self):
        is_valid, errors = validate_puzzle(["not", "a", "dict"])
        self.assertFalse(is_valid)
        self.assertTrue(any("Root payload must be a JSON object" in e for e in errors))

    def test_missing_or_bad_date(self):
        puzzle = make_valid_puzzle()
        del puzzle["date"]
        is_valid, errors = validate_puzzle(puzzle)
        self.assertFalse(is_valid)
        self.assertTrue(any("date" in e for e in errors))

        puzzle["date"] = "not-a-date"
        is_valid, errors = validate_puzzle(puzzle)
        self.assertFalse(is_valid)

        puzzle["date"] = "2026-02-31"  # Invalid calendar day
        is_valid, errors = validate_puzzle(puzzle)
        self.assertFalse(is_valid)

    def test_round_count_must_be_three(self):
        puzzle = make_valid_puzzle()
        puzzle["rounds"].pop()  # Only 2 rounds
        is_valid, errors = validate_puzzle(puzzle)
        self.assertFalse(is_valid)
        self.assertTrue(any("Expected exactly 3 rounds" in e for e in errors))

        with self.assertRaises(ValidationError):
            assert_valid_puzzle(puzzle)

    def test_items_per_round_must_be_four(self):
        puzzle = make_valid_puzzle()
        puzzle["rounds"][0].pop()  # 3 items in round 1
        is_valid, errors = validate_puzzle(puzzle)
        self.assertFalse(is_valid)
        self.assertTrue(any("Round 1 must have exactly 4 items" in e for e in errors))

    def test_headline_length_exceeded(self):
        puzzle = make_valid_puzzle()
        puzzle["rounds"][0][0]["t"] = "A" * (MAX_HEADLINE_LENGTH + 5)
        is_valid, errors = validate_puzzle(puzzle)
        self.assertFalse(is_valid)
        self.assertTrue(any("exceeds maximum length" in e for e in errors))

    def test_empty_headline_rejected(self):
        puzzle = make_valid_puzzle()
        puzzle["rounds"][0][0]["t"] = "   "
        is_valid, errors = validate_puzzle(puzzle)
        self.assertFalse(is_valid)
        self.assertTrue(any("field 't' cannot be empty" in e for e in errors))

    def test_duplicate_headline_in_round(self):
        puzzle = make_valid_puzzle()
        puzzle["rounds"][0][1]["t"] = puzzle["rounds"][0][0]["t"]
        is_valid, errors = validate_puzzle(puzzle)
        self.assertFalse(is_valid)
        self.assertTrue(any("duplicate headline in round" in e for e in errors))

    def test_fake_count_must_be_exactly_one(self):
        # 0 fakes (all real)
        p1 = copy.deepcopy(make_valid_puzzle())
        p1["rounds"][0][2]["real"] = True
        is_valid, errors = validate_puzzle(p1)
        self.assertFalse(is_valid)
        self.assertTrue(any("must contain exactly 1 fake story" in e for e in errors))

        # 2 fakes in round
        p2 = copy.deepcopy(make_valid_puzzle())
        p2["rounds"][0][0]["real"] = False
        p2["rounds"][0][0]["s"] = "Invented for this puzzle."
        is_valid, errors = validate_puzzle(p2)
        self.assertFalse(is_valid)
        self.assertTrue(any("must contain exactly 1 fake story" in e for e in errors))

    def test_fake_source_text_must_be_exact(self):
        puzzle = make_valid_puzzle()
        # Find the fake in round 1
        for item in puzzle["rounds"][0]:
            if not item["real"]:
                item["s"] = "Fake story from somewhere else."
        is_valid, errors = validate_puzzle(puzzle)
        self.assertFalse(is_valid)
        self.assertTrue(any("must be 'Invented for this puzzle.'" in e for e in errors))

    def test_unexpected_or_missing_keys(self):
        puzzle = make_valid_puzzle()
        puzzle["rounds"][0][0]["extra_key"] = "forbidden"
        is_valid, errors = validate_puzzle(puzzle)
        self.assertFalse(is_valid)
        self.assertTrue(any("contains unexpected extra fields" in e for e in errors))

        del puzzle["rounds"][0][0]["extra_key"]
        del puzzle["rounds"][0][0]["s"]
        is_valid, errors = validate_puzzle(puzzle)
        self.assertFalse(is_valid)
        self.assertTrue(any("missing required fields" in e for e in errors))


if __name__ == "__main__":
    unittest.main()
