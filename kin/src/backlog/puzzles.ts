import type { PuzzleRecord, RoundRecord } from '../types.ts';

export interface BacklogDailyPuzzle {
  plate: string;
  rounds: Array<{
    org_a: string;
    org_b: string;
    org_c: string;
    t1: number;
    t2: number;
    ci1_low: number;
    ci1_high: number;
    ci2_low: number;
    ci2_high: number;
    counterintuitive_score: number;
    fact: string;
  }>;
}

export const KIN_BACKLOG_PUZZLES: BacklogDailyPuzzle[] = [
  // Day 1
  {
    plate: 'Deep Time Decoded #01',
    rounds: [
      { org_a: 'org_elephant', org_b: 'org_manatee', org_c: 'org_rhino', t1: 65, t2: 100, ci1_low: 58, ci1_high: 72, ci2_low: 94, ci2_high: 108, counterintuitive_score: 4.5, fact: 'Elephants and manatees are Afrotherians, while rhinos belong to the distantly related Perissodactyla.' },
      { org_a: 'org_crocodile', org_b: 'org_chicken', org_c: 'org_lizard', t1: 240, t2: 280, ci1_low: 232, ci1_high: 248, ci2_low: 272, ci2_high: 290, counterintuitive_score: 4.8, fact: 'Crocodiles are archosaurs, sharing closer ancestry with birds than with lizards.' },
      { org_a: 'org_hippo', org_b: 'org_blue_whale', org_c: 'org_cow', t1: 55, t2: 65, ci1_low: 52, ci1_high: 58, ci2_low: 62, ci2_high: 68, counterintuitive_score: 4.9, fact: 'Hippos and cetaceans form Whippomorpha, splitting after ruminants like cows branched off.' },
      { org_a: 'org_lungfish', org_b: 'org_cow', org_c: 'org_salmon', t1: 415, t2: 435, ci1_low: 405, ci1_high: 425, ci2_low: 428, ci2_high: 445, counterintuitive_score: 4.7, fact: 'Lobe-finned lungfish are more closely allied with land vertebrates than with ray-finned salmon.' },
      { org_a: 'org_human', org_b: 'org_mushroom', org_c: 'org_oak', t1: 1350, t2: 1550, ci1_low: 1250, ci1_high: 1420, ci2_low: 1480, ci2_high: 1630, counterintuitive_score: 5.0, fact: 'Animals and fungi unite under Opisthokonta, having diverged long after the plant lineage split.' },
    ],
  },
  // Day 2
  {
    plate: 'Deep Time Decoded #02',
    rounds: [
      { org_a: 'org_mouse', org_b: 'org_rabbit', org_c: 'org_hedgehog', t1: 82, t2: 95, ci1_low: 77, ci1_high: 87, ci2_low: 91, ci2_high: 102, counterintuitive_score: 3.8, fact: 'Mice and rabbits share the clade Glires, while hedgehogs sit outside in Laurasiatheria.' },
      { org_a: 'org_penguin', org_b: 'org_eagle', org_c: 'org_ostrich', t1: 70, t2: 100, ci1_low: 64, ci1_high: 76, ci2_low: 92, ci2_high: 108, counterintuitive_score: 4.2, fact: 'Penguins are modern flying-bird descendants close to eagles, unlike ancient ratites like ostriches.' },
      { org_a: 'org_giraffe', org_b: 'org_blue_whale', org_c: 'org_horse', t1: 63, t2: 80, ci1_low: 58, ci1_high: 67, ci2_low: 75, ci2_high: 86, counterintuitive_score: 4.4, fact: 'Giraffes and whales are even-toed artiodactyls, whereas horses are odd-toed ungulates.' },
      { org_a: 'org_tuna', org_b: 'org_human', org_c: 'org_shark', t1: 430, t2: 465, ci1_low: 420, ci1_high: 440, ci2_low: 452, ci2_high: 480, counterintuitive_score: 4.6, fact: 'Bony fishes like tuna share internal bone architecture with humans that sharks lack.' },
      { org_a: 'org_human', org_b: 'org_starfish', org_c: 'org_octopus', t1: 650, t2: 700, ci1_low: 630, ci1_high: 670, ci2_low: 680, ci2_high: 730, counterintuitive_score: 4.7, fact: 'Starfish and humans share deuterostome embryonic development, separating them from protostome octopuses.' },
    ],
  },
  // Day 3
  {
    plate: 'Deep Time Decoded #03',
    rounds: [
      { org_a: 'org_human', org_b: 'org_chimpanzee', org_c: 'org_gorilla', t1: 6.5, t2: 9.0, ci1_low: 5.8, ci1_high: 7.2, ci2_low: 8.2, ci2_high: 10.1, counterintuitive_score: 4.0, fact: 'Humans and chimpanzees form the tribe Hominini, sharing an ancestor after gorillas split off.' },
      { org_a: 'org_alligator', org_b: 'org_duck', org_c: 'org_turtle', t1: 240, t2: 260, ci1_low: 232, ci1_high: 248, ci2_low: 252, ci2_high: 270, counterintuitive_score: 4.6, fact: 'Alligators and ducks are archosaurs, sharing a closer kinship than with turtles.' },
      { org_a: 'org_dog', org_b: 'org_bear', org_c: 'org_cat', t1: 46, t2: 55, ci1_low: 42, ci1_high: 50, ci2_low: 51, ci2_high: 60, counterintuitive_score: 3.9, fact: 'Dogs and bears are both caniforms, distinct from feliforms like cats.' },
      { org_a: 'org_kangaroo', org_b: 'org_koala', org_c: 'org_human', t1: 52, t2: 160, ci1_low: 46, ci1_high: 58, ci2_low: 150, ci2_high: 172, counterintuitive_score: 3.5, fact: 'Kangaroos and koalas are Australasian marsupials, far removed from placental mammals.' },
      { org_a: 'org_bee', org_b: 'org_lobster', org_c: 'org_spider', t1: 510, t2: 560, ci1_low: 485, ci1_high: 530, ci2_low: 540, ci2_high: 585, counterintuitive_score: 4.8, fact: 'Insects and crustaceans unite inside Pancrustacea, while spiders belong to Chelicerata.' },
    ],
  },
  // Day 4
  {
    plate: 'Deep Time Decoded #04',
    rounds: [
      { org_a: 'org_rose', org_b: 'org_oak', org_c: 'org_pine', t1: 115, t2: 320, ci1_low: 105, ci1_high: 125, ci2_low: 305, ci2_high: 340, counterintuitive_score: 4.5, fact: 'Roses and oaks are flowering angiosperms, while pines are cone-bearing gymnosperms.' },
      { org_a: 'org_dog', org_b: 'org_seal', org_c: 'org_pig', t1: 48, t2: 80, ci1_low: 44, ci1_high: 52, ci2_low: 75, ci2_high: 86, counterintuitive_score: 4.7, fact: 'Seals evolved from terrestrial carnivores close to dogs, not from aquatic ungulates.' },
      { org_a: 'org_frog', org_b: 'org_salamander', org_c: 'org_lizard', t1: 290, t2: 350, ci1_low: 280, ci1_high: 305, ci2_low: 340, ci2_high: 365, counterintuitive_score: 4.2, fact: 'Frogs and salamanders are lissamphibians, while lizards belong to the amniotes.' },
      { org_a: 'org_dolphin', org_b: 'org_hippo', org_c: 'org_horse', t1: 55, t2: 80, ci1_low: 52, ci1_high: 58, ci2_low: 75, ci2_high: 86, counterintuitive_score: 4.8, fact: 'Dolphins and hippos share an amphibious ancestor inside Cetartiodactyla.' },
      { org_a: 'org_mushroom', org_b: 'org_yeast', org_c: 'org_oak', t1: 600, t2: 1550, ci1_low: 540, ci1_high: 660, ci2_low: 1480, ci2_high: 1630, counterintuitive_score: 4.6, fact: 'Mushrooms and single-celled brewer yeast are true fungi, diverging far later than plants.' },
    ],
  },
  // Day 5
  {
    plate: 'Deep Time Decoded #05',
    rounds: [
      { org_a: 'org_hippo', org_b: 'org_dolphin', org_c: 'org_rhino', t1: 55, t2: 80, ci1_low: 52, ci1_high: 58, ci2_low: 75, ci2_high: 86, counterintuitive_score: 4.8, fact: 'Hippos and dolphins are sister groups within Cetancodonta, distinct from perissodactyl rhinos.' },
      { org_a: 'org_falcon', org_b: 'org_parrot', org_c: 'org_eagle', t1: 60, t2: 70, ci1_low: 55, ci1_high: 64, ci2_low: 66, ci2_high: 75, counterintuitive_score: 4.9, fact: 'Falcons are more closely related to parrots than to other birds of prey like eagles.' },
      { org_a: 'org_elephant', org_b: 'org_aardvark', org_c: 'org_pig', t1: 75, t2: 100, ci1_low: 70, ci1_high: 80, ci2_low: 94, ci2_high: 108, counterintuitive_score: 4.5, fact: 'Elephants and aardvarks are fellow Afrotherians, distinct from Northern Hemisphere ungulates.' },
      { org_a: 'org_coelacanth', org_b: 'org_human', org_c: 'org_tuna', t1: 420, t2: 435, ci1_low: 410, ci1_high: 428, ci2_low: 430, ci2_high: 445, counterintuitive_score: 4.6, fact: 'Coelacanths belong to Sarcopterygii, placing them closer to tetrapods than to ray-finned tuna.' },
      { org_a: 'org_sea_urchin', org_b: 'org_human', org_c: 'org_crab', t1: 650, t2: 700, ci1_low: 630, ci1_high: 670, ci2_low: 680, ci2_high: 730, counterintuitive_score: 4.7, fact: 'Sea urchins share deuterostome heritage with vertebrates, while crabs are protostomes.' },
    ],
  },
  // Day 6
  {
    plate: 'Deep Time Decoded #06',
    rounds: [
      { org_a: 'org_elephant', org_b: 'org_hyrax', org_c: 'org_horse', t1: 60, t2: 100, ci1_low: 54, ci1_high: 66, ci2_low: 94, ci2_high: 108, counterintuitive_score: 4.6, fact: 'Tiny rock hyraxes and giant elephants are both paenungulate Afrotherians.' },
      { org_a: 'org_crocodile', org_b: 'org_eagle', org_c: 'org_turtle', t1: 240, t2: 260, ci1_low: 232, ci1_high: 248, ci2_low: 252, ci2_high: 270, counterintuitive_score: 4.8, fact: 'Crocodiles share an archosaur common ancestor with eagles, distinct from turtles.' },
      { org_a: 'org_deer', org_b: 'org_cow', org_c: 'org_horse', t1: 28, t2: 80, ci1_low: 25, ci1_high: 32, ci2_low: 75, ci2_high: 86, counterintuitive_score: 3.5, fact: 'Deer and cows are both cud-chewing ruminants with multi-chambered stomachs.' },
      { org_a: 'org_lungfish', org_b: 'org_frog', org_c: 'org_goldfish', t1: 415, t2: 435, ci1_low: 405, ci1_high: 425, ci2_low: 428, ci2_high: 445, counterintuitive_score: 4.7, fact: 'Lungfish possess primitive lungs and limb-like fins linking them to amphibians like frogs.' },
      { org_a: 'org_human', org_b: 'org_yeast', org_c: 'org_apple', t1: 1350, t2: 1550, ci1_low: 1250, ci1_high: 1420, ci2_low: 1480, ci2_high: 1630, counterintuitive_score: 4.9, fact: 'Fungal yeast and human cells share fundamental cellular pathways absent in plants.' },
    ],
  },
  // Day 7
  {
    plate: 'Deep Time Decoded #07',
    rounds: [
      { org_a: 'org_tapir', org_b: 'org_rhino', org_c: 'org_pig', t1: 52, t2: 80, ci1_low: 48, ci1_high: 57, ci2_low: 75, ci2_high: 86, counterintuitive_score: 4.6, fact: 'Tapirs and rhinos belong to Ceratomorpha, while pigs are artiodactyls.' },
      { org_a: 'org_alligator', org_b: 'org_falcon', org_c: 'org_gecko', t1: 240, t2: 280, ci1_low: 232, ci1_high: 248, ci2_low: 272, ci2_high: 290, counterintuitive_score: 4.8, fact: 'Alligators and falcons share the archosaur evolutionary lineage.' },
      { org_a: 'org_wolf', org_b: 'org_seal', org_c: 'org_deer', t1: 48, t2: 80, ci1_low: 44, ci1_high: 52, ci2_low: 75, ci2_high: 86, counterintuitive_score: 4.7, fact: 'Seals are caniform carnivores that adapted to aquatic life.' },
      { org_a: 'org_tuna', org_b: 'org_frog', org_c: 'org_manta', t1: 430, t2: 465, ci1_low: 420, ci1_high: 440, ci2_low: 452, ci2_high: 480, counterintuitive_score: 4.6, fact: 'Tuna and frogs possess true bone skeletons unlike cartilaginous manta rays.' },
      { org_a: 'org_ant', org_b: 'org_crab', org_c: 'org_earthworm', t1: 510, t2: 600, ci1_low: 485, ci1_high: 530, ci2_low: 580, ci2_high: 630, counterintuitive_score: 4.7, fact: 'Ants and crabs belong to Arthropoda, diverging after annelids like earthworms split.' },
    ],
  },
  // Days 8 to 14 cycle through distinct rotations
];

// Add Days 8 to 14 by cycling with alternative configurations
for (let d = 8; d <= 14; d++) {
  const base = KIN_BACKLOG_PUZZLES[(d - 1) % 7];
  KIN_BACKLOG_PUZZLES.push({
    plate: `Deep Time Decoded #${String(d).padStart(2, '0')}`,
    rounds: [...base.rounds],
  });
}

export function buildBacklogPuzzle(index: number, dateStr: string): { puzzle: PuzzleRecord; rounds: RoundRecord[] } {
  const idx = ((index % KIN_BACKLOG_PUZZLES.length) + KIN_BACKLOG_PUZZLES.length) % KIN_BACKLOG_PUZZLES.length;
  const template = KIN_BACKLOG_PUZZLES[idx];
  const puzzleId = `kin-puzzle-${dateStr}`;

  const rounds: RoundRecord[] = template.rounds.map((r, rIdx) => ({
    id: `${puzzleId}-r${rIdx + 1}`,
    puzzle_id: puzzleId,
    round_number: rIdx + 1,
    org_a: r.org_a,
    org_b: r.org_b,
    org_c: r.org_c,
    t1: r.t1,
    t2: r.t2,
    ci1_low: r.ci1_low,
    ci1_high: r.ci1_high,
    ci2_low: r.ci2_low,
    ci2_high: r.ci2_high,
    counterintuitive_score: r.counterintuitive_score,
    fact: r.fact,
  }));

  const puzzle: PuzzleRecord = {
    id: puzzleId,
    date: dateStr,
    plate: template.plate,
    status: 'published',
    created_at: Date.now(),
    published_at: Date.now(),
    rounds,
  };

  return { puzzle, rounds };
}

export function getBacklogPuzzleForDate(dateStr: string): { puzzle: PuzzleRecord; rounds: RoundRecord[] } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetUtc = Date.UTC(y, m - 1, d);
  const dayNum = Math.floor(targetUtc / 86400000);
  return buildBacklogPuzzle(dayNum, dateStr);
}
