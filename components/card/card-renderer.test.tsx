import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { parseCardData, type CardDataInput } from '@/lib/card-schema';
import { parseTheme, type ThemeInput } from '@/lib/theme-schema';
import { CardRenderer } from './card-renderer';
import { placeholderCardData } from './placeholder-card';
import { darkTheme, lightTheme } from './test-themes';

const CARD_DIR = join(process.cwd(), 'components', 'card');

function sourceFiles(): { name: string; source: string }[] {
  return readdirSync(CARD_DIR)
    .filter((name) => /\.tsx?$/.test(name) && !name.includes('.test.'))
    .map((name) => ({ name, source: readFileSync(join(CARD_DIR, name), 'utf8') }));
}

/**
 * Comments explain the rules below, so they would trip the scans that enforce
 * them. Strip them first — crude is fine, this only ever reads our own source.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

/* -------------------------------------------------------------------------- */
/* The acceptance criteria                                                    */
/* -------------------------------------------------------------------------- */

describe('CardRenderer takes two inputs and nothing else', () => {
  it('declares exactly `data` and `theme` as props', () => {
    const source = readFileSync(join(CARD_DIR, 'card-renderer.tsx'), 'utf8');
    const block = /export type CardRendererProps = \{([\s\S]*?)\n\};/.exec(source);

    expect(block).not.toBeNull();
    const keys = [...block![1]!.matchAll(/^\s*(\w+)\s*:/gm)].map((match) => match[1]);
    expect(keys).toEqual(['data', 'theme']);
  });

  it('ignores anything else handed to it', () => {
    // If a third input ever started influencing output, this would diverge.
    const plain = render(<CardRenderer data={placeholderCardData} theme={lightTheme} />)
      .container.innerHTML;

    const extra = { data: placeholderCardData, theme: lightTheme, slug: 'apa-apa' };
    const withExtra = render(
      <CardRenderer {...(extra as unknown as Parameters<typeof CardRenderer>[0])} />,
    ).container.innerHTML;

    expect(withExtra).toBe(plain);
  });

  it('is a pure function of its two inputs', () => {
    const once = render(<CardRenderer data={placeholderCardData} theme={lightTheme} />)
      .container.innerHTML;
    const twice = render(<CardRenderer data={placeholderCardData} theme={lightTheme} />)
      .container.innerHTML;

    expect(twice).toBe(once);
  });
});

describe('the same card data under two themes', () => {
  const data = placeholderCardData;

  it('produces different output', () => {
    const light = render(<CardRenderer data={data} theme={lightTheme} />).container
      .innerHTML;
    const dark = render(<CardRenderer data={data} theme={darkTheme} />).container
      .innerHTML;

    expect(light).not.toBe(dark);
  });

  it('carries each theme’s own palette and fonts', () => {
    const cardOf = (container: HTMLElement) =>
      container.querySelector<HTMLElement>('[data-naeqah-card]')!;

    const light = cardOf(
      render(<CardRenderer data={data} theme={lightTheme} />).container,
    );
    const dark = cardOf(render(<CardRenderer data={data} theme={darkTheme} />).container);

    expect(light.style.getPropertyValue('--card-primary')).toBe('#7a5c3e');
    expect(dark.style.getPropertyValue('--card-primary')).toBe('#e0c08a');
    expect(dark.style.getPropertyValue('--card-font-display')).toBe(
      '"Great Vibes", cursive',
    );
  });

  it('renders the sections each theme asks for, in that theme’s order', () => {
    const order = (container: HTMLElement) =>
      [...container.querySelectorAll('[data-section]')].map((node) =>
        node.getAttribute('data-section'),
      );

    expect(
      order(render(<CardRenderer data={data} theme={darkTheme} />).container),
    ).toEqual(['pembuka', 'tarikh', 'doa', 'lokasi', 'rsvp']);

    // The light theme lists all ten; the placeholder has no photos, so the
    // gallery is the one block dropped.
    expect(
      order(render(<CardRenderer data={data} theme={lightTheme} />).container),
    ).toEqual([
      'pembuka',
      'pengantin',
      'tarikh',
      'lokasi',
      'aturcara',
      'doa',
      'hubungi',
      'rsvp',
      'ucapan',
    ]);
  });

  it('shows the same couple either way — the theme styles, it does not edit', () => {
    for (const theme of [lightTheme, darkTheme]) {
      const { container } = render(<CardRenderer data={data} theme={theme} />);
      expect(container.textContent).toContain('Zulkifli');
      expect(container.textContent).toContain('Aisyah');
      expect(container.textContent).toContain('Sabtu, 15 Mei 2027');
    }
  });
});

describe('no per-template code', () => {
  it('has no branch on a template identity anywhere in components/card/', () => {
    for (const { name, source } of sourceFiles()) {
      const code = stripComments(source);

      expect(code, name).not.toMatch(/\btemplate\s*(===|!==|==|!=)/);
      expect(code, name).not.toMatch(/\btemplateSlug\b/);
      expect(code, name).not.toMatch(/\bslug\b/);
      expect(code, name).not.toMatch(/switch\s*\(\s*template/);
    }
  });

  it('never reads the theme’s name — that label is for the gallery', () => {
    for (const { name, source } of sourceFiles()) {
      expect(stripComments(source), name).not.toMatch(/theme\.name|\.name\s*===/);
    }
  });

  it('imports no theme JSON file directly', () => {
    for (const { name, source } of sourceFiles()) {
      expect(stripComments(source), name).not.toMatch(/lib\/themes\//);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Static-page guarantees                                                     */
/* -------------------------------------------------------------------------- */

describe('the card stays static', () => {
  it('declares no client boundary, so /kad/[slug] prerenders', () => {
    for (const { name, source } of sourceFiles()) {
      expect(source, name).not.toMatch(/['"]use client['"]/);
    }
  });

  it('uses no React hook and no event handler', () => {
    for (const { name, source } of sourceFiles()) {
      const code = stripComments(source);

      expect(code, name).not.toMatch(
        /\buse(State|Effect|Ref|Memo|Callback|Reducer)\s*\(/,
      );
      expect(code, name).not.toMatch(/\son(Click|Change|Submit|Input)=/);
    }
  });

  it('does not route images through the server-side optimiser', () => {
    // next/image would make every photo depend on /_next/image being up; the
    // card has to open when the app is down.
    for (const { name, source } of sourceFiles()) {
      expect(stripComments(source), name).not.toMatch(/from 'next\/image'/);
    }
  });
});

describe('mobile-first', () => {
  it('caps the content column instead of letting it run to the viewport edge', () => {
    const { container } = render(
      <CardRenderer data={placeholderCardData} theme={lightTheme} />,
    );
    const column = container.querySelector('[data-naeqah-card] > div');

    expect(column?.className).toMatch(/\bmax-w-/);
  });

  it('pins nothing to a width a 390px phone cannot show', () => {
    // Measured for real at 390x844 in Chromium: scrollWidth stayed at 390 with
    // the longest names the schema allows and textScale at its 1.4 maximum.
    // This scan is the cheap regression guard for that result — a fixed width
    // or a min-width is how horizontal scroll usually creeps back in.
    for (const { name, source } of sourceFiles()) {
      const code = stripComments(source);

      expect(code, name).not.toMatch(/\bmin-w-/);
      expect(code, name).not.toMatch(/\bw-screen\b/);

      for (const [, width] of code.matchAll(/\bw-\[(\d+)px\]/g)) {
        expect(Number(width), `${name} pins a width of ${width}px`).toBeLessThan(390);
      }
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Dividers, branding, degenerate data                                        */
/* -------------------------------------------------------------------------- */

describe('dividers', () => {
  const dividerCount = (theme: Parameters<typeof CardRenderer>[0]['theme']) =>
    render(
      <CardRenderer data={placeholderCardData} theme={theme} />,
    ).container.querySelectorAll('[data-divider]').length;

  it('places one fewer divider than there are visible sections', () => {
    // The dark theme shows five sections.
    expect(dividerCount(darkTheme)).toBe(4);
  });

  it('draws nothing for a theme that asked for no dividers', () => {
    const none = parseTheme({
      ...(lightTheme as ThemeInput),
      layout: { ...lightTheme.layout, divider: 'tiada' },
    });

    expect(dividerCount(none)).toBe(0);
  });

  it('uses the glyph for "ornamen" and a rule for "garis"', () => {
    const ornament = render(
      <CardRenderer data={placeholderCardData} theme={darkTheme} />,
    ).container.querySelector('[data-divider="ornamen"]');
    const rule = render(
      <CardRenderer data={placeholderCardData} theme={lightTheme} />,
    ).container.querySelector('[data-divider="garis"]');

    expect(ornament).toHaveAttribute('aria-hidden', 'true');
    expect(rule?.tagName).toBe('HR');
  });
});

describe('branding', () => {
  it('shows the footer line when the theme says so', () => {
    render(<CardRenderer data={placeholderCardData} theme={lightTheme} />);
    expect(screen.getByText('Dibuat dengan Naeqah')).toBeInTheDocument();
  });

  it('hides it when the theme says not to', () => {
    render(<CardRenderer data={placeholderCardData} theme={darkTheme} />);
    expect(screen.queryByText('Dibuat dengan Naeqah')).not.toBeInTheDocument();
  });
});

describe('the thinnest possible card', () => {
  const bare = parseCardData({
    couple: { groom: { name: 'Lelaki' }, bride: { name: 'Perempuan' } },
    event: { date: '2027-05-15', startTime: '11:00' },
    venue: { name: 'Dewan', addressLines: ['Jalan 1'] },
  } satisfies CardDataInput);

  it('renders every theme without an empty heading or a stray divider', () => {
    for (const theme of [lightTheme, darkTheme]) {
      const { container } = render(<CardRenderer data={bare} theme={theme} />);
      const sections = container.querySelectorAll('[data-section]').length;
      const dividers = container.querySelectorAll('[data-divider]').length;

      expect(sections).toBeGreaterThan(0);
      expect(container.querySelector('[data-section="aturcara"]')).toBeNull();
      expect(container.querySelector('[data-section="doa"]')).toBeNull();
      expect(container.querySelector('[data-section="galeri"]')).toBeNull();
      expect(container.querySelector('[data-section="hubungi"]')).toBeNull();
      expect(dividers).toBe(theme.layout.divider === 'tiada' ? 0 : sections - 1);
    }
  });

  it('still offers the RSVP block', () => {
    const { container } = render(<CardRenderer data={bare} theme={darkTheme} />);
    expect(container.querySelector('#rsvp')).not.toBeNull();
  });
});

describe('the placeholder card', () => {
  it('satisfies the card schema, so the A6 preview cannot ship broken', () => {
    expect(() => parseCardData(placeholderCardData as CardDataInput)).not.toThrow();
  });

  it('carries no photos, since the licensed assets arrive with A5b', () => {
    expect(placeholderCardData.photos.cover).toBeUndefined();
    expect(placeholderCardData.photos.gallery).toHaveLength(0);
  });
});
