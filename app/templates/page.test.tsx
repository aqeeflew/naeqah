import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadTheme } from '@/lib/themes';
import type { GalleryTemplate } from '@/lib/template-gallery';

/**
 * The page imports `publishedGalleryTemplates` by name, so the binding has to
 * be replaced at module level — an ESM namespace spy would not reach it. The
 * rest of the module is kept real: `TIER_LABELS` is what the tiles print.
 */
const { publishedGalleryTemplates } = vi.hoisted(() => ({
  publishedGalleryTemplates: vi.fn<() => Promise<GalleryTemplate[]>>(),
}));

vi.mock('@/lib/template-gallery', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/template-gallery')>()),
  publishedGalleryTemplates,
}));

import TemplatesPage, { galleryFontHrefs, revalidate } from './page';

const SOURCE = readFileSync(join(process.cwd(), 'app', 'templates', 'page.tsx'), 'utf8');

/** Comments here explain the rules below, so source scans must not read them. */
function code(): string {
  return SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(
    /\{\s*\/\*[\s\S]*?\*\/\s*\}/g,
    '',
  );
}

function template(overrides: Partial<GalleryTemplate> = {}): GalleryTemplate {
  return {
    slug: 'klasik',
    name: 'Klasik',
    tier: 'asas',
    theme: loadTheme('lib/themes/klasik.json'),
    ...overrides,
  };
}

async function renderPage() {
  return render(await TemplatesPage());
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  publishedGalleryTemplates.mockReset();
  // React hoists a `<link precedence>` into the document head, and Testing
  // Library's cleanup does not reach outside the render container — so without
  // this a stylesheet from one test is still there during the next.
  for (const node of document.head.querySelectorAll('link[rel="stylesheet"]')) {
    node.remove();
  }
});

/* -------------------------------------------------------------------------- */
/* The acceptance criterion: the catalogue comes from the database            */
/* -------------------------------------------------------------------------- */

describe('/templates reads the catalogue, it does not contain one', () => {
  it('asks the query layer for published templates', () => {
    expect(code()).toContain('publishedGalleryTemplates()');
  });

  /**
   * `docs/BACKLOG.md` → A6: "galeri membaca dari DB, bukan senarai
   * hardcoded". A theme imported straight into the page, or a literal array of
   * templates, is how that criterion gets quietly broken later.
   */
  it('imports no theme file and holds no list of its own', () => {
    expect(code()).not.toMatch(/from\s+'@?\/?lib\/themes\//);
    expect(code()).not.toMatch(/\.json'/);
    expect(code()).not.toMatch(/slug:\s*'/);
  });

  it('lists what the query returned, in that order', async () => {
    publishedGalleryTemplates.mockResolvedValue([
      template({ slug: 'kedua', name: 'Kedua' }),
      template({ slug: 'pertama', name: 'Pertama' }),
    ]);

    const { container } = await renderPage();
    const slugs = [...container.querySelectorAll('[data-template-tile]')].map((node) =>
      node.getAttribute('data-template-tile'),
    );

    expect(slugs).toEqual(['kedua', 'pertama']);
  });

  it('links each entry to its own full preview', async () => {
    publishedGalleryTemplates.mockResolvedValue([template()]);

    await renderPage();

    expect(screen.getByRole('link', { name: /Klasik/ })).toHaveAttribute(
      'href',
      '/templates/klasik',
    );
  });
});

/* -------------------------------------------------------------------------- */
/* Fresh without a deploy                                                     */
/* -------------------------------------------------------------------------- */

describe('/templates is revalidated', () => {
  /**
   * `docs/SPEC.md` → "Tiga pengguna": an admin must be able to add a template
   * without a code deploy. Rendered once at build time, this page would not
   * notice a row published by the admin panel (task C3) until someone pushed
   * a commit.
   */
  it('re-reads the catalogue on a timer', () => {
    expect(revalidate).toBeTypeOf('number');
    expect(revalidate).toBeGreaterThan(0);
  });

  it('does not opt out of caching altogether', () => {
    expect(code()).not.toContain('force-dynamic');
    expect(code()).not.toContain('no-store');
  });
});

/* -------------------------------------------------------------------------- */
/* The tiles are shown in their own typefaces                                 */
/* -------------------------------------------------------------------------- */

describe('/templates loads the fonts its tiles need', () => {
  const BASE = template().theme;

  const withFont = (googleFont: string) => ({
    ...BASE,
    fonts: {
      ...BASE.fonts,
      heading: { family: `"${googleFont}", serif`, googleFont, weights: [400] },
    },
  });

  /**
   * Asserted on the list rather than on the rendered `<link>`s: React hoists a
   * stylesheet with a `precedence` into the document head and keeps its own
   * record of what it has already inserted, so in a single jsdom document the
   * second test to ask for a font gets nothing back. The hoisting itself is
   * React's behaviour and is proven against a real build instead — see
   * `docs/PROGRESS.md`.
   */
  it('asks for one stylesheet per theme that needs one', () => {
    const hrefs = galleryFontHrefs([
      template({ slug: 'satu', theme: withFont('Playfair Display') }),
      template({ slug: 'dua', theme: withFont('Lora') }),
    ]);

    expect(hrefs).toHaveLength(2);
    expect(hrefs.some((href) => href.includes('Playfair+Display'))).toBe(true);
    expect(hrefs.some((href) => href.includes('Lora'))).toBe(true);
  });

  it('asks once when two templates share a pairing', () => {
    const shared = withFont('Lora');

    expect(
      galleryFontHrefs([
        template({ slug: 'satu', theme: shared }),
        template({ slug: 'dua', theme: shared }),
      ]),
    ).toHaveLength(1);
  });

  /** `klasik` is system fonts only, so the gallery makes no request for it. */
  it('requests nothing for a theme on system fonts', () => {
    expect(galleryFontHrefs([template()])).toEqual([]);
  });

  it('requests nothing for an empty catalogue', () => {
    expect(galleryFontHrefs([])).toEqual([]);
  });

  /** In `<head>`, not in the body, or the type reflows after the tiles paint. */
  it('renders them as hoisted stylesheet links', () => {
    expect(code()).toContain('precedence="card-fonts"');
    expect(code()).toContain('galleryFontHrefs(templates)');
  });
});

/* -------------------------------------------------------------------------- */
/* An empty catalogue                                                         */
/* -------------------------------------------------------------------------- */

describe('/templates with nothing to show', () => {
  it('says so in Bahasa Malaysia instead of rendering a blank page', async () => {
    publishedGalleryTemplates.mockResolvedValue([]);

    await renderPage();

    expect(screen.getByText(/Belum ada template yang diterbitkan/)).toBeInTheDocument();
  });

  /** The state of CI and of every autonomous session — the build must survive it. */
  it('renders with no DATABASE_URL at all', async () => {
    // The real query this time, not a stub: the empty-plus-warning path.
    const actual = await vi.importActual<typeof import('@/lib/template-gallery')>(
      '@/lib/template-gallery',
    );
    publishedGalleryTemplates.mockImplementation(actual.publishedGalleryTemplates);

    vi.stubEnv('DATABASE_URL', '');
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pilih template');
  });

  it('shows no empty list element when there is nothing in it', async () => {
    publishedGalleryTemplates.mockResolvedValue([]);

    const { container } = await renderPage();

    expect(container.querySelector('ul')).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* Mobile-first                                                               */
/* -------------------------------------------------------------------------- */

describe('/templates is mobile-first', () => {
  /**
   * CLAUDE.md → "Mobile-first. Reka pada 390px dahulu, kemudian lebarkan."
   * The phone layout has to be the unprefixed default; a breakpoint may only
   * widen it. The measured proof that nothing overflows 390px is a Chromium
   * run against the built page, recorded in `docs/PROGRESS.md`.
   */
  it('defaults to the phone grid and widens at a breakpoint', async () => {
    publishedGalleryTemplates.mockResolvedValue([template()]);

    const { container } = await renderPage();
    const list = container.querySelector('ul');

    // The unprefixed value is the phone layout; the breakpoint only widens it.
    expect(list?.className).toMatch(/(^|\s)grid-cols-2(\s|$)/);
    expect(list?.className).toMatch(/lg:grid-cols-[3-9]/);
  });

  it('is a server component — no client boundary, no hooks, no handlers', () => {
    expect(code()).not.toMatch(/['"]use client['"]/);
    expect(code()).not.toMatch(/\buse[A-Z]\w*\(/);
    expect(code()).not.toMatch(/\son[A-Z]\w*=/);
  });
});
