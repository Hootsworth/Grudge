from __future__ import annotations

import datetime
import json
import unittest

from fibber.collect import (
    CandidateStory,
    compute_title_similarity,
    deduplicate_candidates,
    is_title_in_used,
    is_within_age,
    normalize_title,
    parse_reddit_json,
    parse_rss_xml,
)


class TestCollectLogic(unittest.TestCase):

    def test_normalize_title(self):
        raw = " [r/nottheonion] &quot;Florida Man&quot; fights alligator &amp; wins - UPI.com "
        normalized = normalize_title(raw)
        self.assertEqual(normalized, '"Florida Man" fights alligator & wins')

        raw_tag = "[Florida] Man arrested for silly prank - HuffPost"
        self.assertEqual(normalize_title(raw_tag), "Man arrested for silly prank")

    def test_title_similarity_identical_and_near_identical(self):
        t1 = "Florida man hurls a live alligator through a Wendy's drive-thru"
        t2 = "Florida man hurls a live alligator through a Wendy's drive-thru"
        self.assertEqual(compute_title_similarity(t1, t2), 1.0)

        # Minor punctuation or casing
        t3 = "FLORIDA MAN HURLS A LIVE ALLIGATOR THROUGH A WENDY'S DRIVE-THRU!"
        self.assertEqual(compute_title_similarity(t1, t3), 1.0)

        # Word reordering or slight change
        t4 = "Florida man throws live alligator through Wendy's drive-thru window"
        sim = compute_title_similarity(t1, t4)
        self.assertGreater(sim, 0.65)

    def test_title_similarity_unrelated(self):
        t1 = "Penguin knighted by Norwegian King's Guard in Edinburgh"
        t2 = "Thieves steal millions of dollars of maple syrup from Canadian reserve"
        sim = compute_title_similarity(t1, t2)
        self.assertLess(sim, 0.3)

    def test_is_within_age(self):
        now = datetime.datetime(2026, 11, 8, 12, 0, 0, tzinfo=datetime.timezone.utc)
        recent_date = datetime.datetime(2026, 11, 4, 10, 0, 0, tzinfo=datetime.timezone.utc)
        old_date = datetime.datetime(2026, 10, 20, 10, 0, 0, tzinfo=datetime.timezone.utc)

        self.assertTrue(is_within_age(recent_date, now=now, max_days=14))
        self.assertFalse(is_within_age(old_date, now=now, max_days=14))

    def test_deduplicate_candidates_in_batch(self):
        c1 = CandidateStory(
            title="Thieves steal millions in maple syrup from Quebec warehouse",
            url="https://news.example.com/maple1",
            source="Feed A",
            published_at="2026-11-05T00:00:00",
        )
        c2 = CandidateStory(
            title="Thieves steal millions in maple syrup from Quebec warehouse - UPI.com",
            url="https://news.example.com/maple2",
            source="Feed B",
            published_at="2026-11-05T01:00:00",
        )
        c3 = CandidateStory(
            title="Penguin promoted to major general in military ceremony",
            url="https://news.example.com/penguin",
            source="Feed C",
            published_at="2026-11-06T00:00:00",
        )

        deduped = deduplicate_candidates([c1, c2, c3], used_history=[])
        self.assertEqual(len(deduped), 2)
        self.assertEqual(deduped[0].url, "https://news.example.com/maple1")
        self.assertEqual(deduped[1].url, "https://news.example.com/penguin")

    def test_deduplicate_against_used_history(self):
        used = [
            {"t": "Florida man hurls a live alligator through a Wendy’s window", "s": "2016"}
        ]
        self.assertTrue(
            is_title_in_used(
                "Florida man hurls a live alligator through Wendy's drive-thru window",
                used,
            )
        )
        self.assertFalse(
            is_title_in_used(
                "Laughter epidemic sweeps through African schools in 1962",
                used,
            )
        )

    def test_parse_reddit_json(self):
        sample_json = json.dumps({
            "data": {
                "children": [
                    {
                        "data": {
                            "title": "Town elects stray cat as honorary mayor for twenty years",
                            "url": "https://example.com/cat-mayor",
                            "created_utc": 1794100000,
                            "over_18": False,
                            "is_self": False,
                            "selftext": "",
                        }
                    },
                    {
                        "data": {
                            "title": "NSFW story should be ignored",
                            "url": "https://example.com/nsfw",
                            "created_utc": 1794100000,
                            "over_18": True,
                            "is_self": False,
                        }
                    },
                    {
                        "data": {
                            "title": "Self text post without link",
                            "url": "",
                            "permalink": "/r/test/comments/123",
                            "created_utc": 1794100000,
                            "over_18": False,
                            "is_self": True,
                        }
                    },
                ]
            }
        })
        now = datetime.datetime.fromtimestamp(1794200000, tz=datetime.timezone.utc)
        stories = parse_reddit_json(sample_json, "Reddit r/test", now=now)
        self.assertEqual(len(stories), 1)
        self.assertEqual(stories[0].title, "Town elects stray cat as honorary mayor for twenty years")
        self.assertEqual(stories[0].url, "https://example.com/cat-mayor")

    def test_parse_rss_xml(self):
        sample_xml = """<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Odd News</title>
            <item>
              <title>Runaway inflatable moon sculpture rolls through intersection</title>
              <link>https://example.com/moon</link>
              <pubDate>Mon, 03 Nov 2026 14:00:00 +0000</pubDate>
              <description>&lt;p&gt;A giant festival balloon escaped.&lt;/p&gt;</description>
            </item>
          </channel>
        </rss>"""
        now = datetime.datetime(2026, 11, 8, tzinfo=datetime.timezone.utc)
        stories = parse_rss_xml(sample_xml, "UPI Odd News", now=now)
        self.assertEqual(len(stories), 1)
        self.assertEqual(stories[0].title, "Runaway inflatable moon sculpture rolls through intersection")
        self.assertEqual(stories[0].url, "https://example.com/moon")
        self.assertEqual(stories[0].summary, "A giant festival balloon escaped.")


if __name__ == "__main__":
    unittest.main()
