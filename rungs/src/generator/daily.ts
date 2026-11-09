// Deterministic daily ladder generator & vetted backlog sets for Rungs
import type { DailyPuzzle, LadderTarget } from "../types.ts";

export const VETTED_LADDER_SETS: DailyPuzzle[] = [
  {
    "date": "2026-11-09",
    "plate": 313,
    "ladders": [
      {
        "round": 1,
        "start": "cold",
        "target": "warm",
        "par": 4,
        "optimalPath": [
          "cold",
          "wold",
          "word",
          "ward",
          "warm"
        ]
      },
      {
        "round": 2,
        "start": "head",
        "target": "tail",
        "par": 4,
        "optimalPath": [
          "head",
          "tead",
          "teal",
          "taal",
          "tail"
        ]
      },
      {
        "round": 3,
        "start": "fire",
        "target": "wood",
        "par": 4,
        "optimalPath": [
          "fire",
          "wire",
          "wore",
          "word",
          "wood"
        ]
      },
      {
        "round": 4,
        "start": "hate",
        "target": "love",
        "par": 3,
        "optimalPath": [
          "hate",
          "late",
          "lote",
          "love"
        ]
      },
      {
        "round": 5,
        "start": "dark",
        "target": "dawn",
        "par": 2,
        "optimalPath": [
          "dark",
          "darn",
          "dawn"
        ]
      }
    ]
  },
  {
    "date": "2026-11-10",
    "plate": 314,
    "ladders": [
      {
        "round": 1,
        "start": "fire",
        "target": "wood",
        "par": 4,
        "optimalPath": [
          "fire",
          "wire",
          "wore",
          "word",
          "wood"
        ]
      },
      {
        "round": 2,
        "start": "hate",
        "target": "love",
        "par": 3,
        "optimalPath": [
          "hate",
          "late",
          "lote",
          "love"
        ]
      },
      {
        "round": 3,
        "start": "dark",
        "target": "dawn",
        "par": 2,
        "optimalPath": [
          "dark",
          "darn",
          "dawn"
        ]
      },
      {
        "round": 4,
        "start": "lead",
        "target": "gold",
        "par": 3,
        "optimalPath": [
          "lead",
          "load",
          "goad",
          "gold"
        ]
      },
      {
        "round": 5,
        "start": "east",
        "target": "west",
        "par": 2,
        "optimalPath": [
          "east",
          "wast",
          "west"
        ]
      }
    ]
  },
  {
    "date": "2026-11-11",
    "plate": 315,
    "ladders": [
      {
        "round": 1,
        "start": "dark",
        "target": "dawn",
        "par": 2,
        "optimalPath": [
          "dark",
          "darn",
          "dawn"
        ]
      },
      {
        "round": 2,
        "start": "lead",
        "target": "gold",
        "par": 3,
        "optimalPath": [
          "lead",
          "load",
          "goad",
          "gold"
        ]
      },
      {
        "round": 3,
        "start": "east",
        "target": "west",
        "par": 2,
        "optimalPath": [
          "east",
          "wast",
          "west"
        ]
      },
      {
        "round": 4,
        "start": "work",
        "target": "play",
        "par": 5,
        "optimalPath": [
          "work",
          "pork",
          "perk",
          "peak",
          "plak",
          "play"
        ]
      },
      {
        "round": 5,
        "start": "bird",
        "target": "nest",
        "par": 5,
        "optimalPath": [
          "bird",
          "gird",
          "girt",
          "gist",
          "gest",
          "nest"
        ]
      }
    ]
  },
  {
    "date": "2026-11-12",
    "plate": 316,
    "ladders": [
      {
        "round": 1,
        "start": "east",
        "target": "west",
        "par": 2,
        "optimalPath": [
          "east",
          "wast",
          "west"
        ]
      },
      {
        "round": 2,
        "start": "work",
        "target": "play",
        "par": 5,
        "optimalPath": [
          "work",
          "pork",
          "perk",
          "peak",
          "plak",
          "play"
        ]
      },
      {
        "round": 3,
        "start": "bird",
        "target": "nest",
        "par": 5,
        "optimalPath": [
          "bird",
          "gird",
          "girt",
          "gist",
          "gest",
          "nest"
        ]
      },
      {
        "round": 4,
        "start": "sand",
        "target": "dune",
        "par": 3,
        "optimalPath": [
          "sand",
          "dand",
          "dane",
          "dune"
        ]
      },
      {
        "round": 5,
        "start": "rock",
        "target": "sand",
        "par": 4,
        "optimalPath": [
          "rock",
          "sock",
          "sack",
          "sank",
          "sand"
        ]
      }
    ]
  },
  {
    "date": "2026-11-13",
    "plate": 317,
    "ladders": [
      {
        "round": 1,
        "start": "bird",
        "target": "nest",
        "par": 5,
        "optimalPath": [
          "bird",
          "gird",
          "girt",
          "gist",
          "gest",
          "nest"
        ]
      },
      {
        "round": 2,
        "start": "sand",
        "target": "dune",
        "par": 3,
        "optimalPath": [
          "sand",
          "dand",
          "dane",
          "dune"
        ]
      },
      {
        "round": 3,
        "start": "rock",
        "target": "sand",
        "par": 4,
        "optimalPath": [
          "rock",
          "sock",
          "sack",
          "sank",
          "sand"
        ]
      },
      {
        "round": 4,
        "start": "fish",
        "target": "hook",
        "par": 5,
        "optimalPath": [
          "fish",
          "hish",
          "hist",
          "host",
          "hoot",
          "hook"
        ]
      },
      {
        "round": 5,
        "start": "moon",
        "target": "star",
        "par": 5,
        "optimalPath": [
          "moon",
          "boon",
          "boor",
          "boar",
          "soar",
          "star"
        ]
      }
    ]
  },
  {
    "date": "2026-11-14",
    "plate": 318,
    "ladders": [
      {
        "round": 1,
        "start": "rock",
        "target": "sand",
        "par": 4,
        "optimalPath": [
          "rock",
          "sock",
          "sack",
          "sank",
          "sand"
        ]
      },
      {
        "round": 2,
        "start": "fish",
        "target": "hook",
        "par": 5,
        "optimalPath": [
          "fish",
          "hish",
          "hist",
          "host",
          "hoot",
          "hook"
        ]
      },
      {
        "round": 3,
        "start": "moon",
        "target": "star",
        "par": 5,
        "optimalPath": [
          "moon",
          "boon",
          "boor",
          "boar",
          "soar",
          "star"
        ]
      },
      {
        "round": 4,
        "start": "wind",
        "target": "rain",
        "par": 4,
        "optimalPath": [
          "wind",
          "rind",
          "rand",
          "raid",
          "rain"
        ]
      },
      {
        "round": 5,
        "start": "game",
        "target": "play",
        "par": 6,
        "optimalPath": [
          "game",
          "gamp",
          "gaup",
          "paup",
          "plup",
          "plap",
          "play"
        ]
      }
    ]
  },
  {
    "date": "2026-11-15",
    "plate": 319,
    "ladders": [
      {
        "round": 1,
        "start": "moon",
        "target": "star",
        "par": 5,
        "optimalPath": [
          "moon",
          "boon",
          "boor",
          "boar",
          "soar",
          "star"
        ]
      },
      {
        "round": 2,
        "start": "wind",
        "target": "rain",
        "par": 4,
        "optimalPath": [
          "wind",
          "rind",
          "rand",
          "raid",
          "rain"
        ]
      },
      {
        "round": 3,
        "start": "game",
        "target": "play",
        "par": 6,
        "optimalPath": [
          "game",
          "gamp",
          "gaup",
          "paup",
          "plup",
          "plap",
          "play"
        ]
      },
      {
        "round": 4,
        "start": "wide",
        "target": "deep",
        "par": 6,
        "optimalPath": [
          "wide",
          "ride",
          "rede",
          "redd",
          "reed",
          "deed",
          "deep"
        ]
      },
      {
        "round": 5,
        "start": "tree",
        "target": "bark",
        "par": 5,
        "optimalPath": [
          "tree",
          "bree",
          "byee",
          "byre",
          "bare",
          "bark"
        ]
      }
    ]
  },
  {
    "date": "2026-11-16",
    "plate": 320,
    "ladders": [
      {
        "round": 1,
        "start": "game",
        "target": "play",
        "par": 6,
        "optimalPath": [
          "game",
          "gamp",
          "gaup",
          "paup",
          "plup",
          "plap",
          "play"
        ]
      },
      {
        "round": 2,
        "start": "wide",
        "target": "deep",
        "par": 6,
        "optimalPath": [
          "wide",
          "ride",
          "rede",
          "redd",
          "reed",
          "deed",
          "deep"
        ]
      },
      {
        "round": 3,
        "start": "tree",
        "target": "bark",
        "par": 5,
        "optimalPath": [
          "tree",
          "bree",
          "byee",
          "byre",
          "bare",
          "bark"
        ]
      },
      {
        "round": 4,
        "start": "song",
        "target": "bird",
        "par": 4,
        "optimalPath": [
          "song",
          "bong",
          "bing",
          "bind",
          "bird"
        ]
      },
      {
        "round": 5,
        "start": "rich",
        "target": "poor",
        "par": 5,
        "optimalPath": [
          "rich",
          "rick",
          "pick",
          "pock",
          "pook",
          "poor"
        ]
      }
    ]
  },
  {
    "date": "2026-11-17",
    "plate": 321,
    "ladders": [
      {
        "round": 1,
        "start": "tree",
        "target": "bark",
        "par": 5,
        "optimalPath": [
          "tree",
          "bree",
          "byee",
          "byre",
          "bare",
          "bark"
        ]
      },
      {
        "round": 2,
        "start": "song",
        "target": "bird",
        "par": 4,
        "optimalPath": [
          "song",
          "bong",
          "bing",
          "bind",
          "bird"
        ]
      },
      {
        "round": 3,
        "start": "rich",
        "target": "poor",
        "par": 5,
        "optimalPath": [
          "rich",
          "rick",
          "pick",
          "pock",
          "pook",
          "poor"
        ]
      },
      {
        "round": 4,
        "start": "calm",
        "target": "wild",
        "par": 4,
        "optimalPath": [
          "calm",
          "calk",
          "walk",
          "wilk",
          "wild"
        ]
      },
      {
        "round": 5,
        "start": "bell",
        "target": "ring",
        "par": 5,
        "optimalPath": [
          "bell",
          "bill",
          "rill",
          "rile",
          "rine",
          "ring"
        ]
      }
    ]
  },
  {
    "date": "2026-11-18",
    "plate": 322,
    "ladders": [
      {
        "round": 1,
        "start": "rich",
        "target": "poor",
        "par": 5,
        "optimalPath": [
          "rich",
          "rick",
          "pick",
          "pock",
          "pook",
          "poor"
        ]
      },
      {
        "round": 2,
        "start": "calm",
        "target": "wild",
        "par": 4,
        "optimalPath": [
          "calm",
          "calk",
          "walk",
          "wilk",
          "wild"
        ]
      },
      {
        "round": 3,
        "start": "bell",
        "target": "ring",
        "par": 5,
        "optimalPath": [
          "bell",
          "bill",
          "rill",
          "rile",
          "rine",
          "ring"
        ]
      },
      {
        "round": 4,
        "start": "word",
        "target": "page",
        "par": 4,
        "optimalPath": [
          "word",
          "ward",
          "pard",
          "pare",
          "page"
        ]
      },
      {
        "round": 5,
        "start": "walk",
        "target": "fall",
        "par": 2,
        "optimalPath": [
          "walk",
          "wall",
          "fall"
        ]
      }
    ]
  },
  {
    "date": "2026-11-19",
    "plate": 323,
    "ladders": [
      {
        "round": 1,
        "start": "bell",
        "target": "ring",
        "par": 5,
        "optimalPath": [
          "bell",
          "bill",
          "rill",
          "rile",
          "rine",
          "ring"
        ]
      },
      {
        "round": 2,
        "start": "word",
        "target": "page",
        "par": 4,
        "optimalPath": [
          "word",
          "ward",
          "pard",
          "pare",
          "page"
        ]
      },
      {
        "round": 3,
        "start": "walk",
        "target": "fall",
        "par": 2,
        "optimalPath": [
          "walk",
          "wall",
          "fall"
        ]
      },
      {
        "round": 4,
        "start": "star",
        "target": "moon",
        "par": 5,
        "optimalPath": [
          "star",
          "sear",
          "sean",
          "mean",
          "moan",
          "moon"
        ]
      },
      {
        "round": 5,
        "start": "hand",
        "target": "foot",
        "par": 4,
        "optimalPath": [
          "hand",
          "fand",
          "fond",
          "food",
          "foot"
        ]
      }
    ]
  },
  {
    "date": "2026-11-20",
    "plate": 324,
    "ladders": [
      {
        "round": 1,
        "start": "walk",
        "target": "fall",
        "par": 2,
        "optimalPath": [
          "walk",
          "wall",
          "fall"
        ]
      },
      {
        "round": 2,
        "start": "star",
        "target": "moon",
        "par": 5,
        "optimalPath": [
          "star",
          "sear",
          "sean",
          "mean",
          "moan",
          "moon"
        ]
      },
      {
        "round": 3,
        "start": "hand",
        "target": "foot",
        "par": 4,
        "optimalPath": [
          "hand",
          "fand",
          "fond",
          "food",
          "foot"
        ]
      },
      {
        "round": 4,
        "start": "lion",
        "target": "bear",
        "par": 4,
        "optimalPath": [
          "lion",
          "leon",
          "lean",
          "bean",
          "bear"
        ]
      },
      {
        "round": 5,
        "start": "tall",
        "target": "wide",
        "par": 4,
        "optimalPath": [
          "tall",
          "wall",
          "will",
          "wile",
          "wide"
        ]
      }
    ]
  },
  {
    "date": "2026-11-21",
    "plate": 325,
    "ladders": [
      {
        "round": 1,
        "start": "hand",
        "target": "foot",
        "par": 4,
        "optimalPath": [
          "hand",
          "fand",
          "fond",
          "food",
          "foot"
        ]
      },
      {
        "round": 2,
        "start": "lion",
        "target": "bear",
        "par": 4,
        "optimalPath": [
          "lion",
          "leon",
          "lean",
          "bean",
          "bear"
        ]
      },
      {
        "round": 3,
        "start": "tall",
        "target": "wide",
        "par": 4,
        "optimalPath": [
          "tall",
          "wall",
          "will",
          "wile",
          "wide"
        ]
      },
      {
        "round": 4,
        "start": "king",
        "target": "rook",
        "par": 5,
        "optimalPath": [
          "king",
          "bing",
          "bong",
          "bonk",
          "book",
          "rook"
        ]
      },
      {
        "round": 5,
        "start": "rose",
        "target": "leaf",
        "par": 5,
        "optimalPath": [
          "rose",
          "lose",
          "lost",
          "lest",
          "leat",
          "leaf"
        ]
      }
    ]
  },
  {
    "date": "2026-11-22",
    "plate": 326,
    "ladders": [
      {
        "round": 1,
        "start": "tall",
        "target": "wide",
        "par": 4,
        "optimalPath": [
          "tall",
          "wall",
          "will",
          "wile",
          "wide"
        ]
      },
      {
        "round": 2,
        "start": "king",
        "target": "rook",
        "par": 5,
        "optimalPath": [
          "king",
          "bing",
          "bong",
          "bonk",
          "book",
          "rook"
        ]
      },
      {
        "round": 3,
        "start": "rose",
        "target": "leaf",
        "par": 5,
        "optimalPath": [
          "rose",
          "lose",
          "lost",
          "lest",
          "leat",
          "leaf"
        ]
      },
      {
        "round": 4,
        "start": "lake",
        "target": "boat",
        "par": 5,
        "optimalPath": [
          "lake",
          "bake",
          "boke",
          "bole",
          "bolt",
          "boat"
        ]
      },
      {
        "round": 5,
        "start": "sail",
        "target": "ship",
        "par": 2,
        "optimalPath": [
          "sail",
          "saip",
          "ship"
        ]
      }
    ]
  }
];

export function getDailyLadderPuzzle(dateStr: string): DailyPuzzle {
  const matched = VETTED_LADDER_SETS.find((s) => s.date === dateStr);
  if (matched) return matched;
  const baseDate = Date.UTC(2026, 0, 1);
  const [y, m, d] = dateStr.split("-").map(Number);
  const curDate = Date.UTC(y, m - 1, d);
  const dayIdx = Math.max(0, Math.floor((curDate - baseDate) / 864e5));
  const plate = dayIdx + 1;
  const setIndex = dayIdx % VETTED_LADDER_SETS.length;
  const template = VETTED_LADDER_SETS[setIndex];
  return { date: dateStr, plate, ladders: template.ladders };
}
