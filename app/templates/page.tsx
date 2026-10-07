/**
 * The template gallery: `/templates`.
 *
 * First screen of the paying flow (SPEC.md → "Aliran utama"), and the only
 * screen where the product is sold — a bride picks here or she leaves. The
 * list comes from the `templates` table, never from a list in this file
 * (docs/BACKLOG.md → A6).
 *
 * **Revalidated, not built once.** `docs/SPEC.md` → "Tiga pengguna" says an
 * admin must be able to add a template *without a code deploy*. A page
 * rendered only at build time would break that promise: publishing a row in
 * the admin panel (task C3) would change nothing until someone pushed a
 * commit. So the catalogue is cached and re-read on a timer instead. The cost
 * is that a newly published template takes up to `revalidate` seconds to
 * appear, which is the right trade for a catalogue that changes a few times a
 * year.
 *
 * This is **not** the guest card, and the static rule in CLAUDE.md →
 * "Halaman kad mesti statik" does not reach here. That rule exists because a
 * guest opens a card on the morning of the wedding and must never meet a
 * database; the gallery is browsed by a bride before any money has changed
 * hands, and the worst case of a stale minute is a template appearing late.
 */
import type { Metadata } from 'next';

import { googleFontsHref } from '@/components/card';
import { TemplateTile } from '@/components/gallery';
import { publishedGalleryTemplates, type GalleryTemplate } from '@/lib/template-gallery';

/** Five minutes. Long enough to be a cache, short enough that C3 feels live. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Template Kad Kahwin — Naeqah',
  description:
    'Pilih reka bentuk kad kahwin digital anda. Setiap template boleh dilihat penuh sebelum anda tempah.',
};

/**
 * Every Google Fonts stylesheet the tiles on this page need, each one once.
 *
 * Without this the miniatures fall back to the browser's serif, and a bride
 * comparing six templates would be comparing six colour schemes set in the
 * same type — half of what a template *is*. The tile is a sales pitch for the
 * card, and the typeface is most of the pitch.
 *
 * Deduplicated because two templates may share a font pairing, and the cost is
 * per distinct stylesheet: this page can make a handful of font requests where
 * a card makes at most one, which is the trade for showing the catalogue
 * honestly. Themes on system fonts — `klasik` is one — add nothing here.
 */
export function galleryFontHrefs(templates: readonly GalleryTemplate[]): string[] {
  const hrefs = new Set<string>();

  for (const template of templates) {
    const href = googleFontsHref(template.theme);

    if (href !== undefined) hrefs.add(href);
  }

  return [...hrefs];
}

export default async function TemplatesPage() {
  const templates = await publishedGalleryTemplates();

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10">
      {/*
        Hoisted into `<head>` by React during prerender, the same arrangement
        `/kad/[slug]` and the full preview use — a stylesheet link emitted
        inside the body loads late and the type visibly reflows.
      */}
      {galleryFontHrefs(templates).map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="card-fonts" />
      ))}

      <header className="max-w-md">
        <h1 className="font-serif text-3xl leading-tight">Pilih template</h1>
        <p className="mt-3 text-neutral-600">
          Tekan mana-mana reka bentuk untuk melihat kad penuh. Butiran majlis anda diisi
          selepas tempahan.
        </p>
      </header>

      {templates.length === 0 ? (
        /*
          Reached in two situations that look the same from here: a deployment
          with no published template yet, and a build with no `DATABASE_URL`
          (CI, and every autonomous session — see `publishedGalleryTemplates`).
          Either way a bride must not meet a blank page, so say something true
          and nothing more. The warning that tells an operator which of the two
          it is goes to the build log, not to her.
        */
        <p className="mt-10 rounded-xl border border-neutral-200 px-5 py-8 text-center text-neutral-600">
          Belum ada template yang diterbitkan. Sila kembali sebentar lagi.
        </p>
      ) : (
        /*
          Two up at 390px, three on a laptop. Mobile-first in the literal
          sense: the phone layout is the unprefixed default and the breakpoint
          only widens it.

          Two rather than one, measured rather than assumed: a single column of
          full-width tiles put 1.5 templates on a 390×844 screen, which makes a
          bride scroll a catalogue she is trying to compare. Two columns put
          four on the same screen, and because the miniature is sized in
          container units it loses no legibility at half the width.
        */
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateTile key={template.slug} template={template} />
          ))}
        </ul>
      )}
    </main>
  );
}
