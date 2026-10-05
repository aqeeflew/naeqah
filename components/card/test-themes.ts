/**
 * Two deliberately dissimilar themes, used by the renderer's tests.
 *
 * They exist to prove the thing the template engine rests on: the same card
 * data rendered under two configurations must come out differently, with no
 * code in `components/card/` knowing which configuration it is. So they differ
 * on every axis the schema offers — palette, fonts, cover composition, section
 * list and order, divider, corners, text scale, body alignment, background kind
 * and branding.
 *
 * Test-only. The first real theme is `lib/themes/klasik.json` (task A5); these
 * are not it, and nothing in the app should import them.
 */
import { parseTheme, type Theme } from '@/lib/theme-schema';

/** Light, serif, centred cover, hairline dividers, every section. */
export const lightTheme: Theme = parseTheme({
  version: 1,
  name: 'Ujian Terang',
  palette: {
    background: '#fdfbf7',
    surface: '#ffffff',
    text: '#2d2a26',
    muted: '#8a8178',
    primary: '#7a5c3e',
    accent: '#c3a67a',
    border: '#e4dcd0',
    onPrimary: '#ffffff',
  },
  fonts: {
    heading: {
      family: '"Cormorant Garamond", serif',
      googleFont: 'Cormorant Garamond',
      weights: [400, 600],
    },
    body: { family: 'ui-sans-serif, system-ui, sans-serif', weights: [400] },
  },
  layout: {
    cover: 'tengah',
    sections: [
      'pembuka',
      'pengantin',
      'tarikh',
      'lokasi',
      'aturcara',
      'doa',
      'galeri',
      'hubungi',
      'rsvp',
      'ucapan',
    ],
    corners: 'bulat',
    divider: 'garis',
  },
  background: { kind: 'warna', color: '#fdfbf7' },
});

/** Dark, sans, full-bleed cover, ornament dividers, a shorter card. */
export const darkTheme: Theme = parseTheme({
  version: 1,
  name: 'Ujian Gelap',
  palette: {
    background: '#14110f',
    surface: '#221d19',
    text: '#f2ece4',
    muted: '#a39a8e',
    primary: '#e0c08a',
    accent: '#8f7a52',
    border: '#3a322b',
    onPrimary: '#14110f',
  },
  fonts: {
    heading: {
      family: '"Playfair Display", serif',
      googleFont: 'Playfair Display',
      weights: [500],
    },
    body: { family: 'Inter, sans-serif', googleFont: 'Inter', weights: [400, 600] },
    display: {
      family: '"Great Vibes", cursive',
      googleFont: 'Great Vibes',
      weights: [400],
      letterSpacing: 0.04,
    },
  },
  layout: {
    // A different order, a different subset, and no gallery or contacts.
    sections: ['pembuka', 'tarikh', 'doa', 'lokasi', 'rsvp'],
    cover: 'penuh',
    corners: 'tajam',
    divider: 'ornamen',
    textScale: 1.2,
    centerBody: true,
  },
  background: { kind: 'gradien', from: '#14110f', to: '#2b231c', angle: 160 },
  showBranding: false,
});
