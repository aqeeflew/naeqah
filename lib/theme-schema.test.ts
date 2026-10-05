import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  assetRefSchema,
  backgroundSchema,
  fontSchema,
  hexColorSchema,
  isTheme,
  layoutSchema,
  paletteSchema,
  parseTheme,
  safeParseTheme,
  sectionIdSchema,
  themeSchema,
  type ThemeInput,
} from './theme-schema';

function palette() {
  return {
    background: '#faf7f2',
    surface: '#ffffff',
    text: '#1f1b16',
    muted: '#7a6f63',
    primary: '#6b4f2a',
    accent: '#c9a227',
    border: '#e4ddd2',
    onPrimary: '#ffffff',
  };
}

function minimalTheme(): ThemeInput {
  return {
    version: 1,
    name: 'Klasik',
    palette: palette(),
    fonts: {
      heading: { family: '"Cormorant Garamond", serif', weights: [500] },
      body: { family: 'system-ui, sans-serif', weights: [400] },
    },
    layout: {
      cover: 'tengah',
      sections: ['pembuka', 'pengantin', 'tarikh', 'lokasi', 'rsvp'],
      corners: 'bulat',
      divider: 'garis',
    },
    background: { kind: 'warna', color: '#faf7f2' },
  };
}

describe('hexColorSchema', () => {
  it.each(['#abc', '#ABCDEF', '#1a1a1a'])('accepts %s', (value) => {
    expect(hexColorSchema.parse(value)).toBe(value);
  });

  it.each(['abc', '#abcd', '#12345', 'rgb(1,2,3)', 'coklat', ''])(
    'rejects %s',
    (value) => {
      expect(hexColorSchema.safeParse(value).success).toBe(false);
    },
  );
});

describe('assetRefSchema', () => {
  it.each(['/themes/klasik/bg.png', 'https://cdn.example.com/bg.png'])(
    'accepts %s',
    (value) => {
      expect(assetRefSchema.parse(value)).toBe(value);
    },
  );

  it.each(['themes/klasik/bg.png', '../bg.png', 'data:image/png;base64,AAA', ''])(
    'rejects %s',
    (value) => {
      expect(assetRefSchema.safeParse(value).success).toBe(false);
    },
  );
});

describe('paletteSchema', () => {
  it('accepts a complete palette', () => {
    expect(paletteSchema.parse(palette())).toEqual(palette());
  });

  it.each(Object.keys(palette()))('requires %s', (key) => {
    const incomplete: Record<string, string> = palette();
    delete incomplete[key];

    const result = paletteSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual([key]);
  });

  it('rejects an extra colour, so the renderer never reads an undeclared slot', () => {
    expect(paletteSchema.safeParse({ ...palette(), highlight: '#ff0000' }).success).toBe(
      false,
    );
  });
});

describe('fontSchema', () => {
  it('accepts a system stack with no Google font', () => {
    const font = fontSchema.parse({ family: 'system-ui, sans-serif', weights: [400] });
    expect(font.googleFont).toBeUndefined();
  });

  it.each([
    [[450]],
    [[50]],
    [[1000]],
    [[400.5]],
    [[400, 400]],
    [[]],
    [[100, 200, 300, 400, 500]],
  ])('rejects weights %j', (weights) => {
    expect(
      fontSchema.safeParse({ family: 'system-ui, sans-serif', weights }).success,
    ).toBe(false);
  });

  it('rejects an out-of-range letterSpacing', () => {
    expect(
      fontSchema.safeParse({
        family: 'system-ui, sans-serif',
        weights: [400],
        letterSpacing: 2,
      }).success,
    ).toBe(false);
  });
});

describe('layoutSchema', () => {
  it('applies defaults for textScale and centerBody', () => {
    const layout = layoutSchema.parse(minimalTheme().layout);

    expect(layout.textScale).toBe(1);
    expect(layout.centerBody).toBe(false);
  });

  it('requires pembuka first', () => {
    const result = layoutSchema.safeParse({
      ...minimalTheme().layout,
      sections: ['pengantin', 'pembuka', 'rsvp'],
    });

    expect(result.success).toBe(false);
  });

  it('requires an rsvp section', () => {
    const result = layoutSchema.safeParse({
      ...minimalTheme().layout,
      sections: ['pembuka', 'pengantin'],
    });

    expect(result.success).toBe(false);
  });

  it('rejects a repeated section', () => {
    const result = layoutSchema.safeParse({
      ...minimalTheme().layout,
      sections: ['pembuka', 'lokasi', 'lokasi', 'rsvp'],
    });

    expect(result.success).toBe(false);
  });

  it('rejects an unknown section id', () => {
    const result = layoutSchema.safeParse({
      ...minimalTheme().layout,
      sections: ['pembuka', 'muzik', 'rsvp'],
    });

    expect(result.success).toBe(false);
  });

  it('accepts every declared section id', () => {
    for (const id of sectionIdSchema.options) {
      expect(sectionIdSchema.safeParse(id).success).toBe(true);
    }
  });

  it.each(['miring', '', 'TENGAH'])('rejects cover style %s', (cover) => {
    expect(layoutSchema.safeParse({ ...minimalTheme().layout, cover }).success).toBe(
      false,
    );
  });
});

describe('backgroundSchema', () => {
  it('accepts a flat colour', () => {
    expect(backgroundSchema.parse({ kind: 'warna', color: '#faf7f2' })).toEqual({
      kind: 'warna',
      color: '#faf7f2',
    });
  });

  it('defaults the gradient angle', () => {
    const background = backgroundSchema.parse({
      kind: 'gradien',
      from: '#faf7f2',
      to: '#e4ddd2',
    });

    expect(background).toEqual({
      kind: 'gradien',
      from: '#faf7f2',
      to: '#e4ddd2',
      angle: 180,
    });
  });

  it('defaults image overlay opacity to fully transparent', () => {
    const background = backgroundSchema.parse({
      kind: 'imej',
      image: '/themes/klasik/bg.jpg',
      fallbackColor: '#faf7f2',
    });

    expect(background).toEqual({
      kind: 'imej',
      image: '/themes/klasik/bg.jpg',
      fallbackColor: '#faf7f2',
      overlayOpacity: 0,
    });
  });

  it('defaults pattern tile size and opacity', () => {
    const background = backgroundSchema.parse({
      kind: 'corak',
      image: '/themes/klasik/corak.png',
      color: '#faf7f2',
    });

    expect(background).toEqual({
      kind: 'corak',
      image: '/themes/klasik/corak.png',
      color: '#faf7f2',
      tileSize: 240,
      opacity: 1,
    });
  });

  it('rejects an unknown kind', () => {
    expect(backgroundSchema.safeParse({ kind: 'video', url: '/a.mp4' }).success).toBe(
      false,
    );
  });

  it('rejects a gradient with no colours', () => {
    expect(backgroundSchema.safeParse({ kind: 'gradien' }).success).toBe(false);
  });

  it('cannot be both a gradient and an image', () => {
    expect(
      backgroundSchema.safeParse({
        kind: 'gradien',
        from: '#faf7f2',
        to: '#e4ddd2',
        image: '/themes/klasik/bg.jpg',
      }).success,
    ).toBe(false);
  });
});

describe('themeSchema — valid input', () => {
  it('accepts the minimal theme', () => {
    expect(() => parseTheme(minimalTheme())).not.toThrow();
  });

  it('defaults showBranding to true, since the asas tier depends on it', () => {
    expect(parseTheme(minimalTheme()).showBranding).toBe(true);
  });

  it('accepts a theme with the display font and ornament filled in', () => {
    const theme: ThemeInput = {
      ...minimalTheme(),
      fonts: {
        ...minimalTheme().fonts,
        display: {
          family: '"Playfair Display", serif',
          googleFont: 'Playfair Display',
          weights: [400, 700],
          letterSpacing: 0.04,
        },
      },
      ornament: '/themes/klasik/ornamen.svg',
      showBranding: false,
    };

    expect(parseTheme(theme).showBranding).toBe(false);
  });

  it('is recognised by the isTheme guard', () => {
    expect(isTheme(minimalTheme())).toBe(true);
    expect(isTheme({})).toBe(false);
    expect(isTheme(null)).toBe(false);
  });

  it('round-trips through JSON, since themes are stored as JSON files', () => {
    const theme = parseTheme(minimalTheme());

    expect(parseTheme(JSON.parse(JSON.stringify(theme)))).toEqual(theme);
  });
});

describe('themeSchema — rejected input', () => {
  it.each([null, undefined, 7, 'klasik', []])('rejects %j', (input) => {
    expect(safeParseTheme(input).success).toBe(false);
  });

  it.each(['version', 'name', 'palette', 'fonts', 'layout', 'background'])(
    'requires %s',
    (key) => {
      const incomplete = minimalTheme() as Record<string, unknown>;
      delete incomplete[key];

      expect(safeParseTheme(incomplete).success).toBe(false);
    },
  );

  it('rejects a version other than 1', () => {
    expect(safeParseTheme({ ...minimalTheme(), version: 2 }).success).toBe(false);
  });

  it('rejects unknown keys rather than silently dropping them', () => {
    const result = safeParseTheme({ ...minimalTheme(), muzik: '/audio/nasyid.mp3' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.code).toBe('unrecognized_keys');
  });

  it('reports errors in Bahasa Malaysia', () => {
    const broken = minimalTheme();
    broken.palette.primary = 'coklat';

    const result = safeParseTheme(broken);
    expect(result.error?.issues[0]?.message).toBe(
      'Warna mesti kod hex, contoh #1a1a1a atau #abc.',
    );
  });
});

describe('themeSchema — card data stays out', () => {
  it.each(['couple', 'event', 'venue', 'programme', 'prayer', 'photos', 'contacts'])(
    'rejects the card-data key %s',
    (key) => {
      expect(safeParseTheme({ ...minimalTheme(), [key]: 'apa-apa' }).success).toBe(false);
    },
  );
});

/**
 * Nothing lives in `lib/themes/` yet — the first theme arrives with task A5.
 * This guard turns real the moment one does, and it is the reason a designer
 * can add a template without touching TypeScript.
 */
describe('lib/themes/*.json', () => {
  const dir = join(import.meta.dirname, 'themes');
  const files = existsSync(dir)
    ? readdirSync(dir).filter((name) => name.endsWith('.json'))
    : [];

  it('every theme file on disk satisfies the schema', () => {
    const failures = files
      .map((name) => {
        const parsed = themeSchema.safeParse(
          JSON.parse(readFileSync(join(dir, name), 'utf8')),
        );
        return parsed.success ? null : `${name}: ${parsed.error.issues[0]?.message}`;
      })
      .filter((failure) => failure !== null);

    expect(failures).toEqual([]);
  });
});
