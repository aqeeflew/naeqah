import { afterEach, describe, expect, it, vi } from 'vitest';

import { SEED_TEMPLATE } from './seed-data';
import { themeFiles } from './themes';
import {
  publishedGalleryTemplate,
  publishedGalleryTemplates,
  resolveGalleryTemplate,
  resolveGalleryTemplates,
  TIER_LABELS,
  type TemplateRow,
} from './template-gallery';
import { tierEnum } from './db/schema';

/** Exactly the shape both queries select. */
function row(overrides: Partial<TemplateRow> = {}): TemplateRow {
  return {
    slug: SEED_TEMPLATE.slug,
    name: SEED_TEMPLATE.name,
    tier: SEED_TEMPLATE.tier,
    themeFile: SEED_TEMPLATE.themeFile,
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/* -------------------------------------------------------------------------- */
/* Rows → drawable templates                                                  */
/* -------------------------------------------------------------------------- */

describe('resolveGalleryTemplate', () => {
  it('pairs a row with the theme its template file names', () => {
    const template = resolveGalleryTemplate(row());

    expect(template).toBeDefined();
    expect(template?.slug).toBe('klasik');
    expect(template?.name).toBe('Klasik');
    expect(template?.tier).toBe('asas');
    expect(template?.theme.name).toBe('Klasik');
  });

  /**
   * The seeded row is the one the gallery will actually show first, so its
   * `theme_file` has to be a key of `themeRegistry` and not merely look like
   * one.
   */
  it('resolves the seeded template', () => {
    expect(themeFiles).toContain(SEED_TEMPLATE.themeFile);
    expect(resolveGalleryTemplate(row())).toBeDefined();
  });

  it('returns undefined for a theme file this build does not ship', () => {
    expect(resolveGalleryTemplate(row({ themeFile: 'lib/themes/tiada.json' }))).toBe(
      undefined,
    );
  });

  it('is strict about the spelling, as loadTheme is', () => {
    expect(resolveGalleryTemplate(row({ themeFile: './lib/themes/klasik.json' }))).toBe(
      undefined,
    );
  });
});

describe('resolveGalleryTemplates', () => {
  it('keeps the order the query gave', () => {
    const resolved = resolveGalleryTemplates([
      row({ slug: 'kedua', name: 'Kedua' }),
      row({ slug: 'pertama', name: 'Pertama' }),
    ]);

    expect(resolved.map((template) => template.slug)).toEqual(['kedua', 'pertama']);
  });

  /**
   * The asymmetry with `lib/card-page.ts` that the module header explains: one
   * unshippable row must not take the catalogue down, because every *other*
   * template is still sellable.
   */
  it('drops an unresolvable row and keeps the rest', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const resolved = resolveGalleryTemplates([
      row({ slug: 'hilang', themeFile: 'lib/themes/belum-deploy.json' }),
      row(),
    ]);

    expect(resolved.map((template) => template.slug)).toEqual(['klasik']);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('names the skipped row, its theme file and the themes that do exist', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    resolveGalleryTemplates([
      row({ slug: 'hilang', themeFile: 'lib/themes/belum-deploy.json' }),
    ]);

    const message = String(warn.mock.calls[0]?.[0]);

    expect(message).toContain('hilang → lib/themes/belum-deploy.json');
    expect(message).toContain(SEED_TEMPLATE.themeFile);
    expect(message).toContain('THEME_SOURCES');
  });

  it('says nothing when every row resolved', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(resolveGalleryTemplates([row()])).toHaveLength(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it('counts the skipped rows rather than warning once each', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    resolveGalleryTemplates([
      row({ slug: 'a', themeFile: 'lib/themes/a.json' }),
      row({ slug: 'b', themeFile: 'lib/themes/b.json' }),
    ]);

    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0]?.[0])).toContain('Skipped 2');
  });
});

/* -------------------------------------------------------------------------- */
/* Tier labels                                                                */
/* -------------------------------------------------------------------------- */

describe('TIER_LABELS', () => {
  it('labels every tier the schema allows', () => {
    expect(Object.keys(TIER_LABELS).sort()).toEqual([...tierEnum.enumValues].sort());
  });

  /**
   * CLAUDE.md → "Jangan reka nilai sebenar". Pricing is explicitly undecided
   * in `docs/SPEC.md`, and the gallery is where a bride would believe a
   * number she saw. A digit in any of these labels means someone put a price
   * in.
   */
  it('carries no price', () => {
    for (const label of Object.values(TIER_LABELS)) {
      expect(label).not.toMatch(/\d|RM/);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Queries with no database                                                   */
/* -------------------------------------------------------------------------- */

describe('publishedGalleryTemplates without DATABASE_URL', () => {
  it('yields an empty catalogue instead of failing the build', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(publishedGalleryTemplates()).resolves.toEqual([]);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('says so loudly, because on a real deployment nobody can buy', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await publishedGalleryTemplates();

    expect(String(warn.mock.calls[0]?.[0])).toMatch(/DATABASE_URL is not set/);
  });

  it('resolves a single template to undefined rather than throwing', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(publishedGalleryTemplate('klasik')).resolves.toBe(undefined);
  });
});
