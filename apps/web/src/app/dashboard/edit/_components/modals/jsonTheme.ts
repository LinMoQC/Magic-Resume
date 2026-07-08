import type { ThemeObject } from '@microlink/react-json-view';

/**
 * Workbench JSON theme for @microlink/react-json-view — a restrained terminal
 * palette on the dark lab surface: sky keys/arrows, one brighter sky for
 * literals, neutral strings, muted punctuation. Keeps the single-accent (sky)
 * system instead of the stock monokai green/orange. base16 map, so unused
 * slots fall back to on-brand neutrals.
 */
export const workbenchJsonTheme: ThemeObject = {
  base00: 'rgba(0,0,0,0)', // background — container paints it
  base01: '#16181b',
  base02: '#23262b', // selection
  base03: '#464c56', // ellipsis / collapsed hint
  base04: '#6b7280',
  base05: '#7d828c', // punctuation / delimiters
  base06: '#aeb6c2',
  base07: '#e6e9ee',
  base08: '#7d828c', // null / undefined — muted, not alarming
  base09: '#38bdf8', // numbers / booleans — bright sky
  base0A: '#7dd3fc',
  base0B: '#a9b1bd', // strings — neutral light
  base0C: '#7dd3fc',
  base0D: '#7dd3fc', // keys + collapse arrows — sky
  base0E: '#38bdf8',
  base0F: '#7d828c',
};

/**
 * Light-mode counterpart — same restrained single-accent (sky) system on warm
 * paper: deep-sky keys/literals for AA contrast, warm-ink strings, and a light
 * warm gray for selection / indent guide-lines (base02) so the tree lines read
 * as faint guides, not the heavy black bars of the dark palette on paper.
 */
export const workbenchJsonThemeLight: ThemeObject = {
  base00: 'rgba(0,0,0,0)',
  base01: '#f0ede6',
  base02: '#e3ded4', // selection / indent guide-lines — faint warm
  base03: '#9a948a', // ellipsis / collapsed hint
  base04: '#8a857c',
  base05: '#6e695f', // punctuation / delimiters — muted warm, readable
  base06: '#4a463f',
  base07: '#2b2723', // brightest text — ink
  base08: '#9a948a', // null / undefined — muted
  base09: '#0369a1', // numbers / booleans — deep sky (AA)
  base0A: '#075985',
  base0B: '#4a463f', // strings — warm ink, readable
  base0C: '#075985',
  base0D: '#0369a1', // keys + collapse arrows — deep sky
  base0E: '#0369a1',
  base0F: '#6e695f',
};
