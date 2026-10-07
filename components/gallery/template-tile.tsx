/**
 * One tappable entry in the template gallery: the miniature, the template's
 * name, and its tier.
 *
 * The chrome around the preview is deliberately *not* themed. Name and tier
 * are app UI in neutral colours, so they stay readable above a dark theme and
 * a pale one alike, and so a bride comparing two templates is comparing the
 * cards rather than two different-looking labels.
 *
 * No price. `docs/SPEC.md` marks tier pricing as not final, and the gallery is
 * the screen a decision gets made on — see `TIER_LABELS` in
 * `lib/template-gallery.ts`.
 */
import Link from 'next/link';

import { TemplatePreview } from './template-preview';
import { TIER_LABELS, type GalleryTemplate } from '@/lib/template-gallery';

export type TemplateTileProps = {
  template: GalleryTemplate;
};

export function TemplateTile({ template }: TemplateTileProps) {
  return (
    <li>
      {/*
        `prefetch={false}` on purpose. Next would otherwise fetch the payload
        of every preview that scrolls into view, and each one is a whole card —
        a real cost for someone shopping on mobile data, which is the majority
        case here (CLAUDE.md → "Mobile-first"). Browsing this page is scrolling
        and then one deliberate tap, so there is nothing to win by guessing
        which tap it will be.
      */}
      <Link
        href={`/templates/${template.slug}`}
        prefetch={false}
        data-template-tile={template.slug}
        className="group block overflow-hidden rounded-xl border border-neutral-200 transition-colors hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
      >
        <TemplatePreview theme={template.theme} />

        {/*
          Stacked, not side by side: at two columns on a 390px screen a tile is
          about 165px wide, and a name beside a tier would start wrapping at
          the first template called something longer than "Klasik".
        */}
        <div className="bg-white px-3 py-2.5">
          <p className="truncate font-serif text-sm text-neutral-900 sm:text-base">
            {template.name}
          </p>
          <p className="mt-0.5 text-[0.6875rem] tracking-wide text-neutral-500 uppercase">
            {TIER_LABELS[template.tier]}
          </p>
        </div>
      </Link>
    </li>
  );
}

export default TemplateTile;
