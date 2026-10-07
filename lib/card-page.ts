/**
 * What `/kad/[slug]` needs, and where it is allowed to get it.
 *
 * Both functions here run at **build time only** — once inside
 * `generateStaticParams`, once while prerendering each page. The guest request
 * path touches neither, because the page is already HTML by then (SPEC.md →
 * architecture decision 1: if the app or the database is down on the morning
 * of the wedding, the card still opens).
 *
 * The pure part is separated from the query on purpose: `resolveCardPage` is
 * where a row becomes a renderable card, and it is the only part that can be
 * tested without credentials. A session with no `DATABASE_URL` can still prove
 * that a published row with a known theme renders, and that a corrupt one
 * fails loudly.
 */
import { and, eq } from 'drizzle-orm';
import { cache } from 'react';

import { safeParseCardData, type CardData } from '@/lib/card-schema';
import { bookings, cards, getDb, templates } from '@/lib/db';
import { hasEnv } from '@/lib/env';
import { loadTheme } from '@/lib/themes';
import type { Theme } from '@/lib/theme-schema';

/** One joined row: the card, plus the theme file of the template it was bought on. */
export type CardPageRow = {
  slug: string;
  data: unknown;
  themeFile: string;
};

/** A card ready for the renderer, which takes exactly these two things. */
export type CardPage = {
  slug: string;
  data: CardData;
  theme: Theme;
};

/* -------------------------------------------------------------------------- */
/* Pure                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * A database row → a renderable card, or an error naming the slug.
 *
 * `cards.data` is `jsonb`, so Postgres guarantees it is JSON and nothing more;
 * whether it is a *card* is this schema's business. Throwing here fails the
 * build, which is the right place for it: a card that silently renders with
 * half its fields missing would be discovered by a guest.
 */
export function resolveCardPage(row: CardPageRow): CardPage {
  const parsed = safeParseCardData(row.data);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue === undefined ? '' : ` at ${issue.path.join('.') || '(root)'}`;
    const why = issue === undefined ? 'unknown validation error' : issue.message;

    throw new Error(
      `Card "${row.slug}" holds data that does not satisfy cardDataSchema${where}: ${why}\n` +
        `Fix: correct cards.data for this slug, or the editor that wrote it.`,
    );
  }

  return {
    slug: row.slug,
    data: parsed.data,
    // Throws with the list of known themes when `templates.theme_file` is
    // wrong — see `lib/themes/index.ts`.
    theme: loadTheme(row.themeFile),
  };
}

/* -------------------------------------------------------------------------- */
/* Queries (build time)                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Every published card's slug, for `generateStaticParams`.
 *
 * Returns an empty list — with a warning, not an error — when there is no
 * `DATABASE_URL`. That case is the normal state of this repo's CI and of an
 * autonomous session: `next build` must stay green on a checkout that has
 * never seen a database, and the result is simply a build with no card pages
 * in it. A *query* that fails is a different thing entirely and is rethrown,
 * so a misconfigured deployment cannot quietly ship zero cards.
 */
export async function publishedCardSlugs(): Promise<string[]> {
  if (!hasEnv('DATABASE_URL')) {
    console.warn(
      '[kad] DATABASE_URL is not set — building with no card pages. ' +
        'This is expected locally and in CI; on a real deployment it means ' +
        'no guest can open a card.',
    );

    return [];
  }

  const rows = await getDb()
    .select({ slug: cards.slug })
    .from(cards)
    .where(eq(cards.status, 'published'));

  return rows.map((row) => row.slug);
}

/**
 * One published card by slug, or `undefined`.
 *
 * Wrapped in React's `cache` so the page body and `generateMetadata` share a
 * single query per slug instead of each running their own.
 *
 * The theme comes through `bookings` rather than off the card, because the
 * template a couple bought is a fact about the purchase. Joining means a
 * retiered or renamed template never leaves a published card pointing at a
 * theme nobody sold.
 *
 * `cards.expires_at` is **not** filtered on, here or in `publishedCardSlugs`:
 * nothing sets it yet (task B6 does, from the tier) and taking a card down
 * when it expires is a publish-time concern, not a read-time one — a page that
 * is already static cannot start 404ing because a timestamp passed.
 */
export const publishedCardPage = cache(
  async (slug: string): Promise<CardPage | undefined> => {
    if (!hasEnv('DATABASE_URL')) return undefined;

    const rows = await getDb()
      .select({
        slug: cards.slug,
        data: cards.data,
        themeFile: templates.themeFile,
      })
      .from(cards)
      .innerJoin(bookings, eq(bookings.id, cards.bookingId))
      .innerJoin(templates, eq(templates.id, bookings.templateId))
      .where(and(eq(cards.slug, slug), eq(cards.status, 'published')))
      .limit(1);

    const row = rows[0];

    return row === undefined ? undefined : resolveCardPage(row);
  },
);
