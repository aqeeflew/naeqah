import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadTheme } from '@/lib/themes';
import type { GalleryTemplate } from '@/lib/template-gallery';

/**
 * Both query functions are imported by name, so they are replaced at module
 * level; `TIER_LABELS` stays real because the chrome prints it.
 */
const { publishedGalleryTemplate, publishedGalleryTemplates } = vi.hoisted(() => ({
  publishedGalleryTemplate:
    vi.fn<(slug: string) => Promise<GalleryTemplate | undefined>>(),
  publishedGalleryTemplates: vi.fn<() => Promise<GalleryTemplate[]>>(),
}));

vi.mock('@/lib/template-gallery', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/template-gallery')>()),
  publishedGalleryTemplate,
  publishedGalleryTemplates,
}));

import TemplatePreviewPage, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
  revalidate,
} from './page';

const SOURCE = readFileSync(
  join(process.cwd(), 'app', 'templates', '[slug]', 'page.tsx'),
  'utf8',
);

/** Comments here explain the rules below, so source scans must not read them. */
function code(): string {
  return SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(
    /\{\s*\/\*[\s\S]*?\*\/\s*\}/g,
    '',
  );
}

const KLASIK: GalleryTemplate = {
  slug: 'klasik',
  name: 'Klasik',
  tier: 'asas',
  theme: loadTheme('lib/themes/klasik.json'),
};

function params(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  publishedGalleryTemplate.mockReset();
  publishedGalleryTemplates.mockReset();
});

/* -------------------------------------------------------------------------- */
/* The acceptance criterion: the real theme, with placeholder data            */
/* -------------------------------------------------------------------------- */

describe('/templates/[slug] previews the real theme', () => {
  it('renders the card under the theme the row names', async () => {
    publishedGalleryTemplate.mockResolvedValue(KLASIK);

    const { container } = render(await TemplatePreviewPage(params('klasik')));
    const card = container.querySelector('[data-naeqah-card]');

    expect(card).not.toBeNull();
    expect(card?.getAttribute('style')).toContain(KLASIK.theme.palette.primary);
  });

  it('fills it with placeholder data, never a real couple', async () => {
    publishedGalleryTemplate.mockResolvedValue(KLASIK);

    const { container } = render(await TemplatePreviewPage(params('klasik')));

    expect(container.textContent).toContain('Dewan Serbaguna Taman Melati');
    // Not "Nurul": both fixtures have a Nurul. The seeded card's groom and
    // its hall are what only the seeded card has.
    expect(container.textContent).not.toMatch(/Aqeef|Dewan Seri Kenangan/);
  });

  it('uses the one renderer, not a gallery-only copy of the card', () => {
    expect(code()).toContain('CardRenderer');
    expect(code()).toContain('placeholderCardData');
  });

  it('renders every section the theme asks for, as the card page does', async () => {
    publishedGalleryTemplate.mockResolvedValue(KLASIK);

    const { container } = render(await TemplatePreviewPage(params('klasik')));
    const sections = [...container.querySelectorAll('[data-section]')].map((node) =>
      node.getAttribute('data-section'),
    );

    expect(sections[0]).toBe('pembuka');
    expect(sections).toContain('rsvp');
  });
});

/* -------------------------------------------------------------------------- */
/* It must be obvious that this is not an invitation                          */
/* -------------------------------------------------------------------------- */

describe('/templates/[slug] says it is a preview', () => {
  /**
   * The card below the notice names a hall, a date and two people who do not
   * exist. Unlabelled, a screenshot of this page travels as a real
   * invitation.
   */
  it('carries a notice in Bahasa Malaysia above the card', async () => {
    publishedGalleryTemplate.mockResolvedValue(KLASIK);

    const { container } = render(await TemplatePreviewPage(params('klasik')));
    const notice = container.querySelector('[data-preview-notice]');

    expect(notice?.textContent).toMatch(/pratonton/i);
    expect(notice?.textContent).toMatch(/hanya contoh/i);
  });

  it('shows the template name, its tier and a way back to the gallery', async () => {
    publishedGalleryTemplate.mockResolvedValue(KLASIK);

    render(await TemplatePreviewPage(params('klasik')));

    expect(screen.getByText('Klasik')).toBeInTheDocument();
    expect(screen.getByText('Asas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Semua template/ })).toHaveAttribute(
      'href',
      '/templates',
    );
  });

  /**
   * `/kad/[slug]` titles itself with the couple's names because it is a
   * WhatsApp link preview. This page is a shop window, and a share of it that
   * read "Zulkifli & Aisyah" would advertise a wedding that is not happening.
   */
  it('titles itself after the template, not the fictional couple', async () => {
    publishedGalleryTemplate.mockResolvedValue(KLASIK);

    const metadata = await generateMetadata(params('klasik'));

    expect(metadata.title).toBe('Klasik — Pratonton Template | Naeqah');
    expect(String(metadata.title)).not.toMatch(/Zulkifli|Aisyah/);
    expect(metadata.description).toMatch(/hanya contoh/i);
  });

  it('returns empty metadata rather than inventing a title for a 404', async () => {
    publishedGalleryTemplate.mockResolvedValue(undefined);

    await expect(generateMetadata(params('tiada'))).resolves.toEqual({});
  });
});

/* -------------------------------------------------------------------------- */
/* 404s                                                                       */
/* -------------------------------------------------------------------------- */

describe('/templates/[slug] for a slug it cannot draw', () => {
  /**
   * One response for all three cases the query folds together: no such slug,
   * a draft row, and a row whose theme file this build does not ship.
   */
  it('404s instead of rendering a blank card', async () => {
    publishedGalleryTemplate.mockResolvedValue(undefined);

    await expect(TemplatePreviewPage(params('tiada'))).rejects.toThrow();
  });

  it('asks for the slug it was given', async () => {
    publishedGalleryTemplate.mockResolvedValue(KLASIK);

    await TemplatePreviewPage(params('klasik'));

    expect(publishedGalleryTemplate).toHaveBeenCalledWith('klasik');
  });
});

/* -------------------------------------------------------------------------- */
/* Prerendered, but not frozen at build time                                  */
/* -------------------------------------------------------------------------- */

describe('/templates/[slug] caching', () => {
  it('prerenders the slugs it knows', async () => {
    publishedGalleryTemplates.mockResolvedValue([
      KLASIK,
      { ...KLASIK, slug: 'moden', name: 'Moden' },
    ]);

    await expect(generateStaticParams()).resolves.toEqual([
      { slug: 'klasik' },
      { slug: 'moden' },
    ]);
  });

  it('builds green with no catalogue at all', async () => {
    publishedGalleryTemplates.mockResolvedValue([]);

    await expect(generateStaticParams()).resolves.toEqual([]);
  });

  /**
   * The opposite of `/kad/[slug]`, on purpose. A card must 404 when it was not
   * in the build, so a guest request can never reach Postgres (CLAUDE.md →
   * "Halaman kad mesti statik"). A template published after the last deploy
   * must still be previewable, because adding a template without a deploy is a
   * requirement (SPEC.md → "Tiga pengguna").
   */
  it('still serves a template published since the last deploy', () => {
    expect(dynamicParams).toBe(true);
    expect(code()).toContain('export const dynamicParams = true');
  });

  it('is revalidated on the same timer as the gallery', async () => {
    const actual = await vi.importActual<typeof import('../page')>('../page');

    expect(revalidate).toBeTypeOf('number');
    expect(revalidate).toBe(actual.revalidate);
  });

  it('is a server component — no client boundary, no hooks, no handlers', () => {
    expect(code()).not.toMatch(/['"]use client['"]/);
    expect(code()).not.toMatch(/\buse[A-Z]\w*\(/);
    expect(code()).not.toMatch(/\son[A-Z]\w*=/);
  });
});
