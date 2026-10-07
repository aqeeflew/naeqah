/**
 * What `/templates` and `/templates/[slug]` need, and where they get it.
 *
 * The gallery is the first screen of the paying flow (SPEC.md → "Aliran
 * utama": pilih template → bayar → isi butiran → terbit), so it reads the
 * `templates` table rather than a list in the source. That is task A6's first
 * acceptance criterion, and it is also what makes "admin boleh tambah template
 * tanpa deploy kod" (SPEC.md → "Tiga pengguna") true for everything except
 * the theme file itself: publishing a draft row, renaming a template or
 * reordering the catalogue takes a database write and nothing else.
 *
 * The split mirrors `lib/card-page.ts`: the pure half turns rows into
 * renderable templates and is the only half a session without `DATABASE_URL`
 * can test, and the query half is thin enough to read in one go.
 *
 * **One difference from `lib/card-page.ts`, on purpose.** A card whose data or
 * theme is broken throws, because a guest opening a half-rendered invitation
 * on the morning of the wedding is the worst outcome in this product. A
 * template row pointing at a theme file this deployment does not ship is
 * *skipped with a warning* instead: it is the expected state for the minutes
 * between someone publishing a row and the deploy that carries its JSON, and
 * taking the whole catalogue offline over one such row would stop every bride
 * from buying any of the others. The single-template page 404s for the same
 * row — see `publishedGalleryTemplate`.
 */
import { and, asc, eq } from 'drizzle-orm';
import { cache } from 'react';

import { getDb, templates, type Tier } from '@/lib/db';
import { hasEnv } from '@/lib/env';
import { findTheme, themeFiles } from '@/lib/themes';
import type { Theme } from '@/lib/theme-schema';

/** One `templates` row, exactly as the queries below select it. */
export type TemplateRow = {
  slug: string;
  name: string;
  tier: Tier;
  themeFile: string;
};

/** A template the gallery can draw: its catalogue columns plus its theme. */
export type GalleryTemplate = {
  slug: string;
  name: string;
  tier: Tier;
  theme: Theme;
};

/**
 * Tier → the label shown in the gallery.
 *
 * Labels only. **No prices**: `docs/SPEC.md` marks tier pricing as not final,
 * and printing a ringgit figure on the page a bride decides from would be the
 * invented value CLAUDE.md forbids — the kind that gets screenshotted. The
 * price belongs on the checkout screen (task B2) once it is decided.
 */
export const TIER_LABELS: Readonly<Record<Tier, string>> = Object.freeze({
  asas: 'Asas',
  premium: 'Premium',
  eksklusif: 'Eksklusif',
});

/* -------------------------------------------------------------------------- */
/* Pure                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * One row → a drawable template, or `undefined` when its theme file is not in
 * `themeRegistry` (`lib/themes/index.ts`).
 *
 * `findTheme` rather than `loadTheme`, which is the whole point: `loadTheme`
 * throws, and the caller here wants to drop one tile, not the page.
 */
export function resolveGalleryTemplate(row: TemplateRow): GalleryTemplate | undefined {
  const theme = findTheme(row.themeFile);

  if (theme === undefined) return undefined;

  return { slug: row.slug, name: row.name, tier: row.tier, theme };
}

/**
 * Rows → the templates that can actually be drawn, in the order given.
 *
 * Every skipped row is named in a warning, with the themes that do exist. A
 * row nobody can see is a configuration mistake somebody has to find, and the
 * build log is where they will look.
 */
export function resolveGalleryTemplates(rows: readonly TemplateRow[]): GalleryTemplate[] {
  const resolved: GalleryTemplate[] = [];
  const skipped: string[] = [];

  for (const row of rows) {
    const template = resolveGalleryTemplate(row);

    if (template === undefined) {
      skipped.push(`${row.slug} → ${row.themeFile}`);
      continue;
    }

    resolved.push(template);
  }

  if (skipped.length > 0) {
    console.warn(
      `[templates] Skipped ${skipped.length} published template(s) whose theme ` +
        `file is not in this build: ${skipped.join(', ')}.\n` +
        `Known themes: ${themeFiles.join(', ')}.\n` +
        `Fix: deploy the theme JSON and register it in THEME_SOURCES ` +
        `(lib/themes/index.ts), or correct templates.theme_file.`,
    );
  }

  return resolved;
}

/* -------------------------------------------------------------------------- */
/* Queries                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Every published template, ordered as the catalogue should read.
 *
 * `sort_order` first so an admin can place a template without renaming it
 * (that column exists for this page — see `lib/db/schema.ts`), then `name` so
 * the default of everything at `0` is still stable rather than whatever
 * Postgres returns that day. A gallery that reshuffles between two visits
 * makes a bride think she lost the one she liked.
 *
 * With no `DATABASE_URL` this returns an empty list and warns, exactly as
 * `publishedCardSlugs` does: that is the normal state of CI and of an
 * autonomous session, and `next build` has to stay green there. A query that
 * *fails* is a different thing and is rethrown.
 */
export async function publishedGalleryTemplates(): Promise<GalleryTemplate[]> {
  if (!hasEnv('DATABASE_URL')) {
    console.warn(
      '[templates] DATABASE_URL is not set — the gallery will be empty. ' +
        'This is expected locally and in CI; on a real deployment it means ' +
        'no bride can pick a template.',
    );

    return [];
  }

  const rows = await getDb()
    .select({
      slug: templates.slug,
      name: templates.name,
      tier: templates.tier,
      themeFile: templates.themeFile,
    })
    .from(templates)
    .where(eq(templates.status, 'published'))
    .orderBy(asc(templates.sortOrder), asc(templates.name));

  return resolveGalleryTemplates(rows);
}

/**
 * One published template by slug, or `undefined`.
 *
 * `undefined` covers three cases the preview page treats identically, because
 * a bride who followed a stale link is owed the same 404 either way: no such
 * slug, a draft row, and a row whose theme file this build does not ship.
 *
 * Wrapped in React's `cache` so the page body and `generateMetadata` share one
 * query per slug, the same arrangement `publishedCardPage` uses.
 */
export const publishedGalleryTemplate = cache(
  async (slug: string): Promise<GalleryTemplate | undefined> => {
    if (!hasEnv('DATABASE_URL')) return undefined;

    const rows = await getDb()
      .select({
        slug: templates.slug,
        name: templates.name,
        tier: templates.tier,
        themeFile: templates.themeFile,
      })
      .from(templates)
      .where(and(eq(templates.slug, slug), eq(templates.status, 'published')))
      .limit(1);

    const row = rows[0];

    if (row === undefined) return undefined;

    return resolveGalleryTemplates([row])[0];
  },
);
