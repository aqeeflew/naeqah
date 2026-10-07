import { describe, expect, it } from 'vitest';
import { parseTheme, type Theme, type ThemeInput } from '@/lib/theme-schema';
import { backgroundStyle, cardStyle, googleFontsHref, hexToRgba } from './card-theme';
import { darkTheme, lightTheme } from './test-themes';

/** The light theme with one branch replaced — keeps each test to one variable. */
function themeWith(patch: Partial<ThemeInput>): Theme {
  return parseTheme({ ...(lightTheme as ThemeInput), ...patch });
}

describe('hexToRgba', () => {
  it('expands the three-digit form', () => {
    expect(hexToRgba('#abc', 1)).toBe('rgb(170 187 204 / 1)');
  });

  it('reads the six-digit form', () => {
    expect(hexToRgba('#1a2b3c', 0.5)).toBe('rgb(26 43 60 / 0.5)');
  });

  it('handles black and white without losing a channel', () => {
    expect(hexToRgba('#000000', 0.2)).toBe('rgb(0 0 0 / 0.2)');
    expect(hexToRgba('#ffffff', 0.2)).toBe('rgb(255 255 255 / 0.2)');
  });
});

describe('backgroundStyle', () => {
  it('always sets a background colour so the card is never blank while loading', () => {
    const kinds: Theme['background'][] = [
      { kind: 'warna', color: '#ffffff' },
      { kind: 'gradien', from: '#000000', to: '#ffffff', angle: 90 },
      { kind: 'imej', image: '/bg.jpg', fallbackColor: '#101010', overlayOpacity: 0 },
      { kind: 'corak', image: '/tile.png', color: '#fafafa', tileSize: 120, opacity: 1 },
    ];

    for (const background of kinds) {
      expect(backgroundStyle(background).backgroundColor).toBeDefined();
    }
  });

  it('builds a gradient at the declared angle', () => {
    expect(
      backgroundStyle({ kind: 'gradien', from: '#111111', to: '#222222', angle: 160 }),
    ).toMatchObject({
      backgroundColor: '#111111',
      backgroundImage: 'linear-gradient(160deg, #111111, #222222)',
    });
  });

  it('covers an image background and does not tile it', () => {
    expect(
      backgroundStyle({
        kind: 'imej',
        image: '/latar.jpg',
        fallbackColor: '#101010',
        overlayOpacity: 0,
      }),
    ).toMatchObject({
      backgroundImage: 'url("/latar.jpg")',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
    });
  });

  it('stacks the overlay as a gradient layer, since an image cannot carry opacity', () => {
    const style = backgroundStyle({
      kind: 'imej',
      image: '/latar.jpg',
      fallbackColor: '#101010',
      overlayColor: '#000000',
      overlayOpacity: 0.4,
    });

    expect(style.backgroundImage).toBe(
      'linear-gradient(rgb(0 0 0 / 0.4), rgb(0 0 0 / 0.4)), url("/latar.jpg")',
    );
  });

  it('skips the overlay layer entirely at zero opacity', () => {
    const style = backgroundStyle({
      kind: 'imej',
      image: '/latar.jpg',
      fallbackColor: '#101010',
      overlayColor: '#000000',
      overlayOpacity: 0,
    });

    expect(style.backgroundImage).toBe('url("/latar.jpg")');
  });

  it('tiles a pattern at its declared size', () => {
    expect(
      backgroundStyle({
        kind: 'corak',
        image: '/corak.png',
        color: '#fafafa',
        tileSize: 180,
        opacity: 1,
      }),
    ).toMatchObject({
      backgroundImage: 'url("/corak.png")',
      backgroundSize: '180px auto',
      backgroundRepeat: 'repeat',
    });
  });

  it('dims a pattern toward its own base colour, not toward white', () => {
    const style = backgroundStyle({
      kind: 'corak',
      image: '/corak.png',
      color: '#14110f',
      tileSize: 240,
      opacity: 0.25,
    });

    expect(style.backgroundImage).toBe(
      'linear-gradient(rgb(20 17 15 / 0.75), rgb(20 17 15 / 0.75)), url("/corak.png")',
    );
    // The veil layer sizes itself; only the tile gets the declared size.
    expect(style.backgroundSize).toBe('auto, 240px auto');
  });
});

describe('googleFontsHref', () => {
  it('returns undefined for a theme that asks only for system fonts', () => {
    const systemOnly = themeWith({
      fonts: {
        heading: { family: 'Georgia, serif', weights: [400] },
        body: { family: 'system-ui, sans-serif', weights: [400] },
      },
    });

    expect(googleFontsHref(systemOnly)).toBeUndefined();
  });

  it('lists every family the theme names, including the display face', () => {
    const href = googleFontsHref(darkTheme);

    expect(href).toContain('family=Playfair+Display:wght@500');
    expect(href).toContain('family=Inter:wght@400;600');
    expect(href).toContain('family=Great+Vibes:wght@400');
    expect(href).toContain('display=swap');
  });

  it('merges the weights of one family requested twice', () => {
    const shared = themeWith({
      fonts: {
        heading: { family: 'Inter, sans-serif', googleFont: 'Inter', weights: [600] },
        body: { family: 'Inter, sans-serif', googleFont: 'Inter', weights: [400] },
      },
    });

    const href = googleFontsHref(shared);

    expect(href).toBe(
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap',
    );
  });
});

describe('cardStyle', () => {
  it('exposes every palette slot as a custom property', () => {
    const style = cardStyle(lightTheme) as Record<string, string>;

    expect(style['--card-background']).toBe(lightTheme.palette.background);
    expect(style['--card-surface']).toBe(lightTheme.palette.surface);
    expect(style['--card-text']).toBe(lightTheme.palette.text);
    expect(style['--card-muted']).toBe(lightTheme.palette.muted);
    expect(style['--card-primary']).toBe(lightTheme.palette.primary);
    expect(style['--card-accent']).toBe(lightTheme.palette.accent);
    expect(style['--card-border']).toBe(lightTheme.palette.border);
    expect(style['--card-on-primary']).toBe(lightTheme.palette.onPrimary);
  });

  it('falls back to the heading face when a theme names no display face', () => {
    const style = cardStyle(lightTheme) as Record<string, string>;

    expect(lightTheme.fonts.display).toBeUndefined();
    expect(style['--card-font-display']).toBe(lightTheme.fonts.heading.family);
  });

  it('uses the display face when the theme has one', () => {
    const style = cardStyle(darkTheme) as Record<string, string>;

    expect(style['--card-font-display']).toBe('"Great Vibes", cursive');
    expect(style['--card-tracking-display']).toBe('0.04em');
  });

  it('writes letter spacing as em and "normal" when unset', () => {
    const style = cardStyle(lightTheme) as Record<string, string>;

    expect(style['--card-tracking-heading']).toBe('normal');
  });

  it('maps each corner style to a radius', () => {
    const radius = (corners: 'tajam' | 'bulat' | 'lengkung') =>
      (
        cardStyle(themeWith({ layout: { ...lightTheme.layout, corners } })) as Record<
          string,
          string
        >
      )['--card-radius'];

    expect(radius('tajam')).toBe('0px');
    expect(radius('bulat')).not.toBe('0px');
    expect(radius('lengkung')).not.toBe(radius('bulat'));
  });

  it('gives a "tiada" divider zero width', () => {
    const style = cardStyle(
      themeWith({ layout: { ...lightTheme.layout, divider: 'tiada' } }),
    ) as Record<string, string>;

    expect(style['--card-divider-width']).toBe('0px');
  });

  it('carries the text scale through as a number', () => {
    expect((cardStyle(darkTheme) as Record<string, string>)['--card-text-scale']).toBe(
      '1.2',
    );
    expect((cardStyle(lightTheme) as Record<string, string>)['--card-text-scale']).toBe(
      '1',
    );
  });

  it('merges the page background in', () => {
    expect(cardStyle(lightTheme).backgroundColor).toBe('#fdfbf7');
    expect(cardStyle(darkTheme).backgroundImage).toContain('linear-gradient(160deg');
  });
});
