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
