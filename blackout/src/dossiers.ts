// Curated historical & scientific classified dossiers for Blackout
import type { DossierRecord, DocumentToken } from './types.ts';

export const COMMON_ARTICLES = new Set([
  'the', 'a', 'an', 'of', 'in', 'on', 'at', 'and', 'to', 'for', 'by', 'with', 'from', 'as', 'is', 'was', 'were', 'it', 'its', 'that'
]);

export const VETTED_DOSSIERS: DossierRecord[] = [
  {
    id: 'manhattan-project',
    date: '2026-11-09',
    plate: 313,
    classification: 'TOP SECRET // DECLASSIFIED',
    category: 'Atomic Physics & Military Espionage',
    title: 'Manhattan Project',
    aliases: ['manhattan project', 'the manhattan project', 'manhattan engineering district', 'project manhattan'],
    year: 1945,
    excerpt: 'The Manhattan Project was a research and development undertaking during World War II that produced the first nuclear weapons. Led by the United States with the assistance of the United Kingdom and Canada, the project succeeded in creating the atomic bomb at Los Alamos under the scientific direction of J. Robert Oppenheimer.',
    citation: 'https://en.wikipedia.org/wiki/Manhattan_Project',
  },
  {
    id: 'rosetta-stone',
    date: '2026-11-10',
    plate: 314,
    classification: 'ARCHIVAL DOSSIER // DECLASSIFIED',
    category: 'Ancient Epigraphy & Linguistics',
    title: 'Rosetta Stone',
    aliases: ['rosetta stone', 'the rosetta stone'],
    year: 1799,
    excerpt: 'The Rosetta Stone is an ancient granodiorite stele inscribed with three versions of a decree issued in Memphis, Egypt. Because the decree appears in Ancient Egyptian hieroglyphs, Demotic script, and Ancient Greek, the stone provided the indispensable key to the modern decipherment of Egyptian hieroglyphs.',
    citation: 'https://en.wikipedia.org/wiki/Rosetta_Stone',
  },
  {
    id: 'voyager-record',
    date: '2026-11-11',
    plate: 315,
    classification: 'DEEP SPACE INTERCEPT // EYES ONLY',
    category: 'Astrophysics & Interstellar Artifacts',
    title: 'Voyager Golden Record',
    aliases: ['voyager golden record', 'golden record', 'the voyager golden record', 'voyager record'],
    year: 1977,
    excerpt: 'The Voyager Golden Record is a phonograph record that was included aboard both Voyager spacecraft launched in 1977. The record contains sounds and images selected to portray the diversity of life and culture on Earth, intended for any intelligent extraterrestrial life form who may find them in interstellar space.',
    citation: 'https://en.wikipedia.org/wiki/Voyager_Golden_Record',
  },
  {
    id: 'apollo-11',
    date: '2026-11-12',
    plate: 316,
    classification: 'MISSION FLIGHT LOG // RESTRICTED',
    category: 'Space Exploration & Aeronautics',
    title: 'Apollo 11',
    aliases: ['apollo 11', 'apollo xi', 'apollo eleven', 'project apollo 11'],
    year: 1969,
    excerpt: 'Apollo 11 was the American spaceflight that first landed humans on the Moon. Commander Neil Armstrong and Lunar Module Pilot Buzz Aldrin landed the Apollo Lunar Module Eagle on July 20, 1969, and Armstrong became the first person to step onto the lunar surface six hours later.',
    citation: 'https://en.wikipedia.org/wiki/Apollo_11',
  },
  {
    id: 'enigma-machine',
    date: '2026-11-13',
    plate: 317,
    classification: 'ULTRA // TOP SECRET',
    category: 'Cryptanalysis & Wartime Intelligence',
    title: 'Enigma Machine',
    aliases: ['enigma machine', 'enigma', 'the enigma machine', 'enigma cipher'],
    year: 1940,
    excerpt: 'The Enigma machine was an electro-mechanical rotor cipher machine developed and used in the early-to-mid 20th century to protect commercial, diplomatic, and military communication. German armed forces used Enigma extensively during World War II until British codebreakers at Bletchley Park, led by Alan Turing, successfully broke the cipher.',
    citation: 'https://en.wikipedia.org/wiki/Enigma_machine',
  },
  {
    id: 'penicillin-discovery',
    date: '2026-11-14',
    plate: 318,
    classification: 'MEDICAL DISPATCH // DECLASSIFIED',
    category: 'Microbiology & Antibiotics',
    title: 'Penicillin',
    aliases: ['penicillin', 'discovery of penicillin', 'penicillin antibiotic'],
    year: 1928,
    excerpt: 'Penicillin was discovered in 1928 by Scottish physician Alexander Fleming. After returning from a holiday, Fleming noticed that a green mold named Penicillium notatum had contaminated a Petri dish containing Staphylococcus bacteria, and that the colonies of bacteria surrounding the fungus had been completely destroyed.',
    citation: 'https://en.wikipedia.org/wiki/Penicillin',
  },
  {
    id: 'library-of-alexandria',
    date: '2026-11-15',
    plate: 319,
    classification: 'HISTORICAL RECONSTRUCTION // UNRESTRICTED',
    category: 'Classical Antiquity & Scholarly Archives',
    title: 'Library of Alexandria',
    aliases: ['library of alexandria', 'the library of alexandria', 'great library of alexandria'],
    year: 283,
    excerpt: 'The Great Library of Alexandria in Egypt was one of the largest and most significant libraries of the ancient world. Dedicated to the Muses, the library was part of a larger research institution called the Mouseion, housing hundreds of thousands of papyrus scrolls until its destruction across multiple historical fires.',
    citation: 'https://en.wikipedia.org/wiki/Library_of_Alexandria',
  },
  {
    id: 'cuban-missile-crisis',
    date: '2026-11-16',
    plate: 320,
    classification: 'DEFCON 2 // TOP SECRET',
    category: 'Cold War Geopolitics & Nuclear Deterrence',
    title: 'Cuban Missile Crisis',
    aliases: ['cuban missile crisis', 'october crisis', 'the cuban missile crisis'],
    year: 1962,
    excerpt: 'The Cuban Missile Crisis was a 13-day confrontation between the United States and the Soviet Union initiated by the American discovery of Soviet nuclear ballistic missiles deployed in Cuba. It is widely considered the closest the Cold War came to escalating into a full-scale nuclear confrontation.',
    citation: 'https://en.wikipedia.org/wiki/Cuban_Missile_Crisis',
  },
  {
    id: 'hubble-telescope',
    date: '2026-11-17',
    plate: 321,
    classification: 'ORBITAL OBSERVATORY // DECLASSIFIED',
    category: 'Deep Space Astronomy & Cosmology',
    title: 'Hubble Space Telescope',
    aliases: ['hubble space telescope', 'hubble telescope', 'hubble', 'hst'],
    year: 1990,
    excerpt: 'The Hubble Space Telescope was launched into low Earth orbit in 1990 and remains in operation. Positioned above the distortion of the atmosphere, Hubble has delivered razor-sharp images of distant galaxies and helped astronomers accurately determine the rate of expansion of the universe.',
    citation: 'https://en.wikipedia.org/wiki/Hubble_Space_Telescope',
  },
  {
    id: 'antikythera-mechanism',
    date: '2026-11-18',
    plate: 322,
    classification: 'ARCHAEOLOGICAL RECOVERY // DECLASSIFIED',
    category: 'Hellenistic Astronomy & Ancient Computing',
    title: 'Antikythera Mechanism',
    aliases: ['antikythera mechanism', 'the antikythera mechanism', 'antikythera'],
    year: 1901,
    excerpt: 'The Antikythera mechanism is an ancient Greek hand-powered mechanical analog computer recovered from a shipwreck off the island of Antikythera. Built in the second century BC, the complex clockwork assembly of bronze gears predicted astronomical positions, lunar phases, and eclipses decades in advance.',
    citation: 'https://en.wikipedia.org/wiki/Antikythera_mechanism',
  },
  {
    id: 'operation-overlord',
    date: '2026-11-19',
    plate: 323,
    classification: 'SUPREME HEADQUARTERS // TOP SECRET',
    category: 'Amphibious Warfare & Military History',
    title: 'D-Day',
    aliases: ['d-day', 'd day', 'operation overlord', 'normandy landings', 'normandy invasion'],
    year: 1944,
    excerpt: 'Operation Overlord was the codename for the Battle of Normandy, the Allied operation that launched the successful invasion of German-occupied Western Europe during World War II. The operation was launched on June 6, 1944 with the Normandy landings, representing the largest amphibious assault in history.',
    citation: 'https://en.wikipedia.org/wiki/Operation_Overlord',
  },
  {
    id: 'crispr-cas9',
    date: '2026-11-20',
    plate: 324,
    classification: 'GENOMIC PROTOCOL // DECLASSIFIED',
    category: 'Molecular Biology & Genetic Engineering',
    title: 'CRISPR',
    aliases: ['crispr', 'crispr-cas9', 'crispr cas9', 'crispr gene editing'],
    year: 2012,
    excerpt: 'CRISPR is a family of DNA sequences found in the genomes of prokaryotic organisms such as bacteria. Adapted into a revolutionary gene-editing technology by Jennifer Doudna and Emmanuelle Charpentier, the Cas9 enzyme uses guide RNA to snip targeted sections of DNA with extraordinary molecular precision.',
    citation: 'https://en.wikipedia.org/wiki/CRISPR',
  },
  {
    id: 'chernobyl-disaster',
    date: '2026-11-21',
    plate: 325,
    classification: 'NUCLEAR EMERGENCY DOSSIER // DECLASSIFIED',
    category: 'Nuclear Physics & Environmental Calamity',
    title: 'Chernobyl Disaster',
    aliases: ['chernobyl disaster', 'chernobyl accident', 'chernobyl', 'the chernobyl disaster'],
    year: 1986,
    excerpt: 'The Chernobyl disaster was a catastrophic nuclear accident that occurred on April 26, 1986, at the No. 4 reactor in the Chernobyl Nuclear Power Plant near Pripyat in northern Ukraine. A safety test caused an uncontrolled nuclear chain reaction and steam explosions that ruptured the reactor core and released radioactive contaminants across Europe.',
    citation: 'https://en.wikipedia.org/wiki/Chernobyl_disaster',
  },
  {
    id: 'dna-double-helix',
    date: '2026-11-22',
    plate: 326,
    classification: 'MOLECULAR DISCOVERY // DECLASSIFIED',
    category: 'Biochemistry & Molecular Genetics',
    title: 'DNA Double Helix',
    aliases: ['dna double helix', 'structure of dna', 'dna', 'double helix'],
    year: 1953,
    excerpt: 'The molecular structure of DNA was solved in 1953 by James Watson and Francis Crick at the Cavendish Laboratory, built upon the crucial X-ray diffraction images captured by Rosalind Franklin and Raymond Gosling. The double helix structure immediately revealed how genetic instructions are copied and transmitted between generations.',
    citation: 'https://en.wikipedia.org/wiki/Molecular_structure_of_Nucleic_Acids',
  },
];

/**
 * Tokenizes an excerpt into structured tokens with punctuation and word values.
 */
export function tokenizeExcerpt(text: string): DocumentToken[] {
  // Split on whitespace while preserving words and surrounding punctuation
  const rawWords = text.trim().split(/\s+/);
  const tokens: DocumentToken[] = [];

  for (let i = 0; i < rawWords.length; i++) {
    const raw = rawWords[i];
    // Clean normalized word (stripping leading/trailing punctuation)
    const word = raw.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').toLowerCase();
    const isPunctuationOnly = word.length === 0;
    const isCommonArticle = !isPunctuationOnly && COMMON_ARTICLES.has(word);

    tokens.push({
      index: i,
      word,
      raw,
      isPunctuationOnly,
      isCommonArticle,
    });
  }

  return tokens;
}

/**
 * Normalizes title string for lenient comparisons.
 */
export function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if guess matches any alias or normalized title.
 */
export function isTitleMatch(guess: string, dossier: DossierRecord): boolean {
  const normGuess = normalizeTitle(guess);
  if (!normGuess) return false;

  if (normGuess === normalizeTitle(dossier.title)) return true;
  for (const alias of dossier.aliases) {
    if (normGuess === normalizeTitle(alias)) return true;
  }
  return false;
}

/**
 * Returns the daily dossier for a given date.
 */
export function getDailyDossier(dateStr: string): DossierRecord {
  const matched = VETTED_DOSSIERS.find((d) => d.date === dateStr);
  if (matched) return matched;

  // Deterministic rotation based on day index
  const baseDate = Date.UTC(2026, 0, 1);
  const [y, m, d] = dateStr.split('-').map(Number);
  const curDate = Date.UTC(y, m - 1, d);
  const dayIdx = Math.max(0, Math.floor((curDate - baseDate) / 864e5));
  const plate = dayIdx + 1;

  const idx = dayIdx % VETTED_DOSSIERS.length;
  const template = VETTED_DOSSIERS[idx];

  return {
    ...template,
    date: dateStr,
    plate,
  };
}
