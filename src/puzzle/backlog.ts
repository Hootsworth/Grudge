import type { Puzzle, PuzzleEvent } from '../types.ts';

export interface BacklogTemplate {
  plate: string;
  theme: any;
  spread_type: any;
  events: Array<{
    text: string;
    year: number;
    precision: 'exact' | 'approximate';
    source: string;
  }>;
}

export const BACKLOG_PUZZLES: BacklogTemplate[] = [
  // 1. Science / Century (Hard: 1900 - 1990)
  {
    plate: 'The Quantum Century',
    theme: 'science',
    spread_type: 'century',
    events: [
      { text: 'Hubble discovers galaxies beyond the Milky Way', year: 1924, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Edwin_Hubble' },
      { text: 'Penicillin is discovered in Alexander Fleming’s lab', year: 1928, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Penicillin' },
      { text: 'Watson and Crick determine DNA double helix structure', year: 1953, precision: 'exact', source: 'https://en.wikipedia.org/wiki/DNA' },
      { text: 'Cosmic microwave background radiation detected', year: 1964, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Cosmic_microwave_background' },
      { text: 'The first cloned mammal Dolly the sheep is born', year: 1996, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Dolly_(sheep)' },
      { text: 'Planck introduces quantum theory of black-body radiation', year: 1900, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Max_Planck' },
    ],
  },
  // 2. Exploration / Millennia (Easy: BCE to 20th century)
  {
    plate: 'Across Oceans & Orbits',
    theme: 'exploration',
    spread_type: 'millennia',
    events: [
      { text: 'Phoenician circumnavigation of Africa under Necho II', year: -600, precision: 'approximate', source: 'https://en.wikipedia.org/wiki/Phoenicia' },
      { text: 'Vikings establish settlement at L’Anse aux Meadows', year: 1000, precision: 'approximate', source: 'https://en.wikipedia.org/wiki/L%27Anse_aux_Meadows' },
      { text: 'Magellan’s expedition completes global circumnavigation', year: 1522, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Ferdinand_Magellan' },
      { text: 'Amundsen leads expedition reaching the South Pole', year: 1911, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Roald_Amundsen' },
      { text: 'Yuri Gagarin completes orbital flight around Earth', year: 1961, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Yuri_Gagarin' },
      { text: 'Voyager 1 enters interstellar space', year: 2012, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Voyager_1' },
    ],
  },
  // 3. Culture / Era (Medium: 1400 - 1900)
  {
    plate: 'Renaissance to Modernity',
    theme: 'culture',
    spread_type: 'era',
    events: [
      { text: 'Gutenberg press produces copies of the Latin Bible', year: 1455, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Gutenberg_Bible' },
      { text: 'Shakespeare’s Globe Theatre opens in London', year: 1599, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Globe_Theatre' },
      { text: 'Diderot and d’Alembert publish the Encyclopedie', year: 1751, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Encyclop%C3%A9die' },
      { text: 'Beethoven conducts premiere of the Ninth Symphony', year: 1824, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Symphony_No._9_(Beethoven)' },
      { text: 'The Eiffel Tower opens for the Paris Exposition', year: 1889, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Eiffel_Tower' },
      { text: 'The Louvre Museum officially opens to the public', year: 1793, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Louvre' },
    ],
  },
  // 4. Technology / Century (Hard: 1900 - 1980)
  {
    plate: 'Silicon & Microchips',
    theme: 'technology',
    spread_type: 'century',
    events: [
      { text: 'Wright brothers conduct sustained powered airplane flight', year: 1903, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Wright_brothers' },
      { text: 'Bell Labs engineers invent the point-contact transistor', year: 1947, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Transistor' },
      { text: 'First message transmitted over ARPANET network', year: 1969, precision: 'exact', source: 'https://en.wikipedia.org/wiki/ARPANET' },
      { text: 'Intel releases the commercial 4004 microprocessor', year: 1971, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Intel_4004' },
      { text: 'Tim Berners-Lee publishes proposal for the World Wide Web', year: 1989, precision: 'exact', source: 'https://en.wikipedia.org/wiki/World_Wide_Web' },
      { text: 'Edison demonstrates commercial incandescent electric lamp', year: 1879, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Incandescent_light_bulb' },
    ],
  },
  // 5. Sport / Century (Hard: 1890 - 1980)
  {
    plate: 'The Olympic Revival',
    theme: 'sport',
    spread_type: 'century',
    events: [
      { text: 'First modern Olympic Games held in Athens', year: 1896, precision: 'exact', source: 'https://en.wikipedia.org/wiki/1896_Summer_Olympics' },
      { text: 'Tour de France bicycle race stages inaugural edition', year: 1903, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Tour_de_France' },
      { text: 'Inaugural FIFA World Cup tournament held in Uruguay', year: 1930, precision: 'exact', source: 'https://en.wikipedia.org/wiki/1930_FIFA_World_Cup' },
      { text: 'Roger Bannister breaks the four-minute mile barrier', year: 1954, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Four-minute_mile' },
      { text: 'Pele wins three World Cup titles with Brazil', year: 1970, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Pel%C3%A9' },
      { text: 'Miracle on Ice hockey match at Lake Placid', year: 1980, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Miracle_on_Ice' },
    ],
  },
  // 6. Politics / Era (Medium: 1600 - 1950)
  {
    plate: 'Crowns to Republics',
    theme: 'politics',
    spread_type: 'era',
    events: [
      { text: 'Peace of Westphalia ends the Thirty Years’ War', year: 1648, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Peace_of_Westphalia' },
      { text: 'English Parliament passes the Bill of Rights', year: 1689, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Bill_of_Rights_1689' },
      { text: 'Continental Congress adopts Declaration of Independence', year: 1776, precision: 'exact', source: 'https://en.wikipedia.org/wiki/United_States_Declaration_of_Independence' },
      { text: 'Storming of the Bastille sparks revolutionary change', year: 1789, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Storming_of_the_Bastille' },
      { text: 'Congress of Vienna establishes European borders', year: 1815, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Congress_of_Vienna' },
      { text: 'United Nations Charter signed in San Francisco', year: 1945, precision: 'exact', source: 'https://en.wikipedia.org/wiki/United_Nations' },
    ],
  },
  // 7. Ancient World / Millennia (Easy: -2500 to 500 CE)
  {
    plate: 'Dawn of Civilization',
    theme: 'ancient world',
    spread_type: 'millennia',
    events: [
      { text: 'Construction of the Great Pyramid of Giza finishes', year: -2560, precision: 'approximate', source: 'https://en.wikipedia.org/wiki/Great_Pyramid_of_Giza' },
      { text: 'Babylonian king Hammurabi codifies laws on stone stele', year: -1750, precision: 'approximate', source: 'https://en.wikipedia.org/wiki/Code_of_Hammurabi' },
      { text: 'Inaugural ancient Olympic festival recorded at Olympia', year: -776, precision: 'approximate', source: 'https://en.wikipedia.org/wiki/Ancient_Olympic_Games' },
      { text: 'Construction begins on the Parthenon in Athens', year: -447, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Parthenon' },
      { text: 'Julius Caesar assassinated on the Ides of March', year: -44, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Assassination_of_Julius_Caesar' },
      { text: 'Fall of the Western Roman Empire with Romulus Augustulus', year: 476, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Fall_of_the_Western_Roman_Empire' },
    ],
  },
  // 8. Science / Millennia (Easy: BCE to Modern)
  {
    plate: 'From Stars to Atoms',
    theme: 'science',
    spread_type: 'millennia',
    events: [
      { text: 'Aristotle writes natural philosophy treatise Physics', year: -330, precision: 'approximate', source: 'https://en.wikipedia.org/wiki/Physics_(Aristotle)' },
      { text: 'Archimedes formulates law of buoyancy in Syracuse', year: -250, precision: 'approximate', source: 'https://en.wikipedia.org/wiki/Archimedes' },
      { text: 'Copernicus publishes heliocentric astronomical model', year: 1543, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Nicolaus_Copernicus' },
      { text: 'Newton publishes mathematical principles of gravity', year: 1687, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Philosophi%C3%A6_Naturalis_Principia_Mathematica' },
      { text: 'Darwin publishes theory of evolution in Origin of Species', year: 1859, precision: 'exact', source: 'https://en.wikipedia.org/wiki/On_the_Origin_of_Species' },
      { text: 'Einstein publishes theory of General Relativity', year: 1915, precision: 'exact', source: 'https://en.wikipedia.org/wiki/General_relativity' },
    ],
  },
  // 9. Exploration / Century (Hard: 1890 - 1970)
  {
    plate: 'The Polar & Space Race',
    theme: 'exploration',
    spread_type: 'century',
    events: [
      { text: 'Nansen’s ship Fram reaches far northern Arctic waters', year: 1895, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Nansen%27s_Fram_expedition' },
      { text: 'Robert Peary expedition claims reaching North Pole', year: 1909, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Robert_Peary' },
      { text: 'Charles Lindbergh flies solo across Atlantic Ocean', year: 1927, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Charles_Lindbergh' },
      { text: 'Edmund Hillary and Tenzing Norgay summit Mount Everest', year: 1953, precision: 'exact', source: 'https://en.wikipedia.org/wiki/1953_British_Mount_Everest_expedition' },
      { text: 'Bathyscaphe Trieste dives to Challenger Deep ocean floor', year: 1960, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Bathyscaphe_Trieste' },
      { text: 'Apollo 11 mission lands astronauts on the lunar surface', year: 1969, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Apollo_11' },
    ],
  },
  // 10. Culture / Century (Hard: 1880 - 1970)
  {
    plate: 'Modernist Shocks',
    theme: 'culture',
    spread_type: 'century',
    events: [
      { text: 'Van Gogh paints The Starry Night at Saint-Remy', year: 1889, precision: 'exact', source: 'https://en.wikipedia.org/wiki/The_Starry_Night' },
      { text: 'Picasso paints proto-Cubist canvas Les Demoiselles d’Avignon', year: 1907, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Les_Demoiselles_d%27Avignon' },
      { text: 'Stravinsky’s Rite of Spring ballet causes Paris riot', year: 1913, precision: 'exact', source: 'https://en.wikipedia.org/wiki/The_Rite_of_Spring' },
      { text: 'James Joyce publishes modernist novel Ulysses in Paris', year: 1922, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Ulysses_(novel)' },
      { text: 'George Orwell publishes dystopian novel Nineteen Eighty-Four', year: 1949, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Nineteen_Eighty-Four' },
      { text: 'Beatles hold final public concert on Abbey Road rooftop', year: 1969, precision: 'exact', source: 'https://en.wikipedia.org/wiki/The_Beatles%27_rooftop_concert' },
    ],
  },
  // 11. Technology / Era (Medium: 1700 - 1900)
  {
    plate: 'Steam to Electricity',
    theme: 'technology',
    spread_type: 'era',
    events: [
      { text: 'Newcomen constructs atmospheric steam engine for mines', year: 1712, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Newcomen_atmospheric_engine' },
      { text: 'James Watt patents condenser improving steam efficiency', year: 1769, precision: 'exact', source: 'https://en.wikipedia.org/wiki/James_Watt' },
      { text: 'Alessandro Volta invents the electrochemical electric battery', year: 1800, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Voltaic_pile' },
      { text: 'Morse and Vail demonstrate the electromagnetic telegraph', year: 1844, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Electrical_telegraph' },
      { text: 'Alexander Graham Bell patents the speaking telephone', year: 1876, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Telephone' },
      { text: 'Guglielmo Marconi sends transatlantic wireless radio signal', year: 1901, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Guglielmo_Marconi' },
    ],
  },
  // 12. Politics / Century (Hard: 1910 - 1995)
  {
    plate: 'Cold War & Treaties',
    theme: 'politics',
    spread_type: 'century',
    events: [
      { text: 'Treaty of Versailles ends World War I fighting', year: 1919, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Treaty_of_Versailles' },
      { text: 'Twelve Western nations sign North Atlantic Treaty (NATO)', year: 1949, precision: 'exact', source: 'https://en.wikipedia.org/wiki/NATO' },
      { text: 'East Germany erects concrete wall dividing Berlin', year: 1961, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Berlin_Wall' },
      { text: 'Peace accords signed ending American role in Vietnam', year: 1973, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Paris_Peace_Accords' },
      { text: 'Berlin Wall opened as crowds celebrate across border', year: 1989, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Fall_of_the_Berlin_Wall' },
      { text: 'Maastricht Treaty formally establishes European Union', year: 1993, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Maastricht_Treaty' },
    ],
  },
  // 13. Ancient World / Era (Medium: -1200 to -200)
  {
    plate: 'Iron & Classical Age',
    theme: 'ancient world',
    spread_type: 'era',
    events: [
      { text: 'Late Bronze Age collapse strikes eastern Mediterranean kingdoms', year: -1177, precision: 'approximate', source: 'https://en.wikipedia.org/wiki/Late_Bronze_Age_collapse' },
      { text: 'Assyrian king Ashurbanipal establishes royal library at Nineveh', year: -650, precision: 'approximate', source: 'https://en.wikipedia.org/wiki/Library_of_Ashurbanipal' },
      { text: 'Cyrus the Great issues declaration freeing Babylonian captives', year: -539, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Cyrus_Cylinder' },
      { text: 'Battle of Marathon repels Persian invasion forces', year: -490, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Battle_of_Marathon' },
      { text: 'Alexander the Great defeats Persian forces at Gaugamela', year: -331, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Battle_of_Gaugamela' },
      { text: 'Qin Shi Huang unifies warring states and founds Qin dynasty', year: -221, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Qin_Shi_Huang' },
    ],
  },
  // 14. Sport / Era (Medium: 1850 - 1950)
  {
    plate: 'Pioneering Games',
    theme: 'sport',
    spread_type: 'era',
    events: [
      { text: 'America wins inaugural yacht race around Isle of Wight', year: 1851, precision: 'exact', source: 'https://en.wikipedia.org/wiki/America%27s_Cup' },
      { text: 'England and Scotland play first official international soccer match', year: 1872, precision: 'exact', source: 'https://en.wikipedia.org/wiki/1872_Scotland_v_England_football_match' },
      { text: 'Inaugural Wimbledon lawn tennis championships staged', year: 1877, precision: 'exact', source: 'https://en.wikipedia.org/wiki/1877_Wimbledon_Championship' },
      { text: 'First running of the modern Boston Marathon', year: 1897, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Boston_Marathon' },
      { text: 'Inaugural Indianapolis 500 automobile race takes place', year: 1911, precision: 'exact', source: 'https://en.wikipedia.org/wiki/1911_Indianapolis_500' },
      { text: 'Jesse Owens wins four gold medals at Berlin stadium', year: 1936, precision: 'exact', source: 'https://en.wikipedia.org/wiki/Jesse_Owens' },
    ],
  },
];

export function buildPuzzleFromTemplate(template: BacklogTemplate, dateStr: string): { puzzle: Puzzle; events: PuzzleEvent[] } {
  const puzzleId = `puzzle-${dateStr}`;

  // Sort events chronologically: newest (index 0) to oldest (index 5)
  const sorted = [...template.events].sort((a, b) => b.year - a.year);

  const events: PuzzleEvent[] = sorted.map((ev, index) => ({
    id: `${puzzleId}-e${index + 1}`,
    puzzle_id: puzzleId,
    text: ev.text,
    year: ev.year,
    precision: ev.precision,
    source: ev.source,
    true_order: index, // 0 = newest / surface, 5 = oldest / bedrock
  }));

  const puzzle: Puzzle = {
    id: puzzleId,
    date: dateStr,
    plate: template.plate,
    theme: template.theme,
    spread_type: template.spread_type,
    status: 'published',
    created_at: Date.now(),
    published_at: Date.now(),
    events,
  };

  return { puzzle, events };
}

export function getBacklogPuzzleForDate(dateStr: string): { puzzle: Puzzle; events: PuzzleEvent[] } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetUtc = Date.UTC(y, m - 1, d);
  const dayNum = Math.floor(targetUtc / 86400000);
  const index = ((dayNum % BACKLOG_PUZZLES.length) + BACKLOG_PUZZLES.length) % BACKLOG_PUZZLES.length;

  return buildPuzzleFromTemplate(BACKLOG_PUZZLES[index], dateStr);
}
