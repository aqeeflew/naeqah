/**
 * Full preview of one template: `/templates/<slug>`.
 *
 * The same renderer the guest card uses (`components/card/`), the real theme
 * from the database row, and `placeholderCardData` standing in for the couple
 * — which is task A6's third acceptance criterion and the only honest way to
 * show a template before anyone has bought it. Nothing here knows which
 * template it is drawing.
 *
 * **`dynamicParams` is left on, unlike `/kad/[slug]`.** The card page turns it
 * off because a slug that was not in the build must 404 rather than fall back
 * to a per-request database query on a guest's phone (CLAUDE.md → "Halaman kad
 * mesti statik"). The opposite is right here: a template published after the
 * last deploy *should* be previewable, because an admin adding a template
 * without a deploy is a requirement (SPEC.md → "Tiga pengguna"). Known slugs
 * are still prerendered, so the common path is a cached page either way.
 */
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

import { CardRenderer, googleFontsHref, placeholderCardData } from '@/components/card';
import {
  publishedGalleryTemplate,
  publishedGalleryTemplates,
  TIER_LABELS,
} from '@/lib/template-gallery';

/** Matches the gallery, so the two cannot disagree about how stale is stale. */
export const revalidate = 300;

/** See the note above: a template published since the last deploy still works. */
export const dynamicParams = true;

type PageParams = { params: Promise<{ slug: string }> };

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const templates = await publishedGalleryTemplates();

  return templates.map((template) => ({ slug: template.slug }));
}

/**
 * Named after the template, never after the fictional couple inside it.
 *
 * `/kad/[slug]` does the opposite on purpose — its title is the couple's names
 * because that page is a WhatsApp link preview and the whole distribution
 * channel for the product. This one is a shop page, and a share of it that
 * read "Zulkifli & Aisyah" would be advertising a wedding that is not
 * happening.
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const template = await publishedGalleryTemplate(slug);

  if (template === undefined) return {};

  const title = `${template.name} — Pratonton Template | Naeqah`;
  const description = `Pratonton penuh template ${template.name} (${TIER_LABELS[template.tier]}). Butiran majlis dalam pratonton ini hanya contoh.`;

  return { title, description, openGraph: { title, description, type: 'website' } };
}

export default async function TemplatePreviewPage({ params }: PageParams) {
  const { slug } = await params;
  const template = await publishedGalleryTemplate(slug);

  // Covers all three of: no such slug, a draft row, and a row whose theme file
  // this build does not ship. A stale link is owed the same 404 either way.
  if (template === undefined) notFound();

  const fontsHref = googleFontsHref(template.theme);

  return (
    <>
      {/*
        Hoisted into `<head>` by React during prerender, exactly as on the card
        page: a stylesheet `<link>` emitted inside the card body loads late and
        the type visibly reflows. Themes on system fonts make no request.
      */}
      {fontsHref !== undefined && (
        <link rel="stylesheet" href={fontsHref} precedence="card-fonts" />
      )}

      {/*
        App chrome above the card, in neutral colours rather than the theme's.
        It has to stay legible over every theme, and it has to be obviously not
        part of the card — a bride who cannot tell the preview frame from the
        invitation cannot judge the invitation.
      */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
          <Link
            href="/templates"
            className="text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
          >
            ← Semua template
          </Link>
          <span className="font-serif text-base text-neutral-900">{template.name}</span>
          <span className="text-xs tracking-wide text-neutral-500 uppercase">
            {TIER_LABELS[template.tier]}
          </span>
        </div>
      </div>

      {/*
        Said once, in plain words, before the card. The names, the hall and the
        date below are `placeholderCardData` — fictional, by design. Leaving
        this unsaid is how a screenshot of a preview ends up circulating as a
        real invitation.
      */}
      <p
        data-preview-notice=""
        className="mx-auto w-full max-w-5xl px-5 py-3 text-sm text-neutral-600"
      >
        Ini pratonton. Nama, tarikh dan tempat di bawah hanya contoh — butiran majlis anda
        sendiri diisi selepas tempahan.
      </p>

      <CardRenderer data={placeholderCardData} theme={template.theme} />
    </>
  );
}
