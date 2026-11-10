import { defineTheme } from '@astryxdesign/core/theme';
import { themes, defaultThemeSlug } from './astryx-themes';

// Base neutral theme from generated Astryx module
export const baseNeutralTheme = themes[defaultThemeSlug];

/**
 * Oddly Brand Theme extending Astryx Neutral Theme.
 * Customizes the palette with Oddly's signature colors:
 * - Coral: #FF756D (Primary Accent)
 * - Honey Gold: #FFC936 (Secondary Highlight)
 * - Electric Azure: #4389F5 (Interactions & Badges)
 * - Pastel Lavender: #A982F5 (Surfaces & Accents)
 * - Mint Emerald: #2EC4A0 (Success & Streaks)
 * - Editorial Paper (#F6F3EC) / Obsidian (#14131A)
 */
export const oddlyTheme = defineTheme({
  name: 'oddly-neutral',
  extends: baseNeutralTheme,
  tokens: {
    // Primary brand accent (Coral light/dark)
    '--color-accent': ['#FF756D', '#FF756D'],
    // Page & surface background adaptation
    '--color-background-surface': ['#F6F3EC', '#14131A'],
    '--color-background-surface-hover': ['#EDE9DF', '#1E1C27'],
    '--color-background-surface-active': ['#E2DDCF', '#272433'],
    // Borders & dividers
    '--color-border-subtle': ['#E4DFD3', '#2A2833'],
    '--color-border-strong': ['#14131A', '#F6F3EC'],
    // Text colors
    '--color-text-primary': ['#14131A', '#F6F3EC'],
    '--color-text-secondary': ['#76706A', '#9A94A3'],
  },
});
