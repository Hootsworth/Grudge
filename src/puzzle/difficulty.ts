import type { SpreadType, ThemeType } from '../types.ts';

export const THEMES: ThemeType[] = [
  'science',
  'exploration',
  'culture',
  'technology',
  'sport',
  'politics',
  'ancient world',
];

export const SPREADS: SpreadType[] = [
  'millennia', // Easy
  'era',       // Medium
  'century',   // Hard
];

export interface DailyDifficultyConfig {
  theme: ThemeType;
  spread: SpreadType;
  plate: string;
}

const PLATE_NAMES: Record<ThemeType, Record<SpreadType, string>> = {
  science: {
    century: 'The Quantum Century',
    era: 'Scientific Awakening',
    millennia: 'From Stars to Atoms',
  },
  exploration: {
    century: 'The Polar & Space Race',
    era: 'Age of Caravels',
    millennia: 'Across Oceans & Orbits',
  },
  culture: {
    century: 'Modernist Shocks',
    era: 'Renaissance to Enlightenment',
    millennia: 'Epics & Architecture',
  },
  technology: {
    century: 'Silicon & Microchips',
    era: 'Steam to Electricity',
    millennia: 'The Toolmaker’s Ascent',
  },
  sport: {
    century: 'The Olympic Revival',
    era: 'Pioneering Games',
    millennia: 'Chariots to Stadiums',
  },
  politics: {
    century: 'Cold War & Treaties',
    era: 'Crowns to Republics',
    millennia: 'Empires & Constitutions',
  },
  'ancient world': {
    century: 'The Hellenistic Surge',
    era: 'Bronze Age Kingdoms',
    millennia: 'Dawn of Civilization',
  },
};

export function getDifficultyAndThemeForDate(dateStr: string): DailyDifficultyConfig {
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetUtc = Date.UTC(year, month - 1, day);
  const daysSinceEpoch = Math.floor(targetUtc / 86400000);

  const themeIndex = ((daysSinceEpoch % THEMES.length) + THEMES.length) % THEMES.length;
  const spreadIndex = ((daysSinceEpoch % SPREADS.length) + SPREADS.length) % SPREADS.length;

  const theme = THEMES[themeIndex];
  const spread = SPREADS[spreadIndex];
  const plate = PLATE_NAMES[theme][spread] || `${theme.toUpperCase()} · ${spread.toUpperCase()}`;

  return { theme, spread, plate };
}

export function validateEventSpread(
  years: number[],
  expectedSpread: SpreadType
): { valid: boolean; actualSpreadYears: number; reason?: string } {
  if (years.length < 2) {
    return { valid: false, actualSpreadYears: 0, reason: 'Need at least 2 events' };
  }

  const sorted = [...years].sort((a, b) => a - b);
  // Calculate historical span (accounting for no year 0 if spanning BCE to CE)
  const minYear = sorted[0];
  const maxYear = sorted[sorted.length - 1];
  const span = maxYear - minYear - (minYear < 0 && maxYear > 0 ? 1 : 0);

  switch (expectedSpread) {
    case 'century':
      if (span > 120) {
        return {
          valid: false,
          actualSpreadYears: span,
          reason: `Century spread expected <= 100 years, found ${span} years (${minYear} to ${maxYear}).`,
        };
      }
      break;
    case 'millennia':
      if (span < 900) {
        return {
          valid: false,
          actualSpreadYears: span,
          reason: `Millennia spread expected >= 1000 years, found ${span} years (${minYear} to ${maxYear}).`,
        };
      }
      break;
    case 'era':
      if (span < 120 || span > 1000) {
        return {
          valid: false,
          actualSpreadYears: span,
          reason: `Era spread expected 120-1000 years, found ${span} years (${minYear} to ${maxYear}).`,
        };
      }
      break;
  }

  return { valid: true, actualSpreadYears: span };
}
