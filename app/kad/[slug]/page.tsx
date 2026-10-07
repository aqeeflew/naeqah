/**
 * The guest-facing card: `/kad/<slug>`.
 *
 * **This page is static, and that is a product requirement, not an
 * optimisation.** A guest opens this link from WhatsApp on the morning of the
 * wedding; if the app or the database is down at that moment the card must
 * still render (SPEC.md → architecture decision 1, CLAUDE.md → "Halaman kad
 * mesti statik"). So every slug is prerendered at build time and
 * `dynamicParams` is off: a slug that was not in the build 404s rather than
 * quietly falling back to a server render that queries Postgres per request.
 *
 * Anything added here that needs the client belongs in a child island — the
 * RSVP form (task B8) and the wishes list (task B9) will be exactly that. The
 * page itself stays a server component with no hooks and no handlers.
 */
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import {
  CardRenderer,
  displayName,
  formatCardDate,
  googleFontsHref,
  orderedCouple,
} from '@/components/card';
import { publishedCardPage, publishedCardSlugs } from '@/lib/card-page';

/**
 * Only the slugs that existed at build time are served. With no
 * `DATABASE_URL` the list is empty and the build still succeeds — see
 * `publishedCardSlugs`.
 */
export const dynamicParams = false;

type PageParams = { params: Promise<{ slug: string }> };

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await publishedCardSlugs();

  return slugs.map((slug) => ({ slug }));
}

/**
 * The WhatsApp link preview. This is the entire distribution channel for the
 * product, so the title has to be the couple's names rather than the app's.
 *
 * No `openGraph.images` yet: a share image needs an asset, and those arrive
 * with task A5b.
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const page = await publishedCardPage(slug);

  if (page === undefined) return {};

  // Same order the cover prints: the inviting side is named first.
  const [first, second] = orderedCouple(page.data.couple);
  const names = `${displayName(first)} & ${displayName(second)}`;
  const description = `Majlis perkahwinan pada ${formatCardDate(page.data.event.date)} di ${page.data.venue.name}.`;

  return {
    title: `${names} — Jemputan Majlis`,
    description,
    openGraph: { title: names, description, type: 'website' },
  };
}

export default async function KadPage({ params }: PageParams) {
  const { slug } = await params;
  const page = await publishedCardPage(slug);

  // Unreachable while `dynamicParams` is false and the slug came from
  // `generateStaticParams` — kept so the page cannot render a blank card if
  // that ever changes.
  if (page === undefined) notFound();

  const fontsHref = googleFontsHref(page.theme);

  return (
    <>
      {/*
        The stylesheet belongs in `<head>`: a `<link>` inside the card body
        loads late and the text visibly reflows. React hoists a stylesheet with
        a `precedence` into the document head during prerender, which is what
        this relies on. Themes that use system fonts only — `klasik` is one —
        get `undefined` here and make zero network requests.
      */}
      {fontsHref !== undefined && (
        <link rel="stylesheet" href={fontsHref} precedence="card-fonts" />
      )}
      <CardRenderer data={page.data} theme={page.theme} />
    </>
  );
}
