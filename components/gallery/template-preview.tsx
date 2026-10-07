/**
 * The miniature a template is shown as in the gallery.
 *
 * It is not a scaled-down card. A card is `components/card/` rendering ten
 * sections of a real couple's data; this is the smallest thing that still
 * answers the only question a bride is asking while scrolling — *what does
 * this one look like?* — which is colour, type and the shape of the names.
 *
 * It is built the same way the card is, and that matters more than how it
 * looks: the colours and fonts come from `cardStyle(theme)`, the names and
 * date come from `placeholderCardData`, and the file contains no mention of
 * any template (CLAUDE.md → "Enjin template"). A new theme JSON gets a tile
 * for free, and a tile can never drift from the card it previews.
 *
 * Standing in for the couple is `placeholderCardData` — the fictional pair in
 * `components/card/placeholder-card.ts`, written for exactly this. Real card
 * data never reaches this page: the gallery is browsed before anyone has
 * bought anything, so there is no couple to show yet.
 */
import {
  cardStyle,
  displayName,
  formatCardDateShort,
  orderedCouple,
  placeholderCardData,
} from '@/components/card';
import type { Theme } from '@/lib/theme-schema';

/** The same order the real cover prints: the inviting side is named first. */
const [FIRST, SECOND] = orderedCouple(placeholderCardData.couple);

const PREVIEW_NAMES = `${displayName(FIRST)} & ${displayName(SECOND)}`;

const PREVIEW_DATE = formatCardDateShort(placeholderCardData.event.date);

export type TemplatePreviewProps = {
  theme: Theme;
};

/**
 * A fixed-ratio miniature of one theme.
 *
 * `aspect-[3/4]` rather than a height in pixels: a portrait ratio is what an
 * invitation is, and a tile that keeps its shape can sit in a two-up grid on a
 * phone and a three-up grid on a laptop without a second set of rules.
 *
 * **Everything inside is sized in `cqw` — percentages of the tile's own
 * width — not in rem.** The gallery shows two columns at 390px and three on a
 * laptop, so a tile is about 165px wide on a phone and about 300px on a
 * desktop; type fixed in rem would fill the small one and float in a void in
 * the large one. Measured in container units, the miniature is the same
 * picture at every size, which is the only way it can honestly stand in for
 * the card. The theme's own `--card-text-scale` still multiplies on top, so a
 * loud theme and a quiet one differ here exactly as they differ on the card.
 */
export function TemplatePreview({ theme }: TemplatePreviewProps) {
  return (
    <div
      aria-hidden="true"
      data-template-preview=""
      style={{ ...cardStyle(theme), containerType: 'inline-size' }}
      className="flex aspect-[3/4] w-full flex-col items-center justify-center overflow-hidden text-center"
    >
      <p
        className="uppercase"
        style={{
          color: 'var(--card-muted)',
          fontFamily: 'var(--card-font-body)',
          fontSize: '4cqw',
          letterSpacing: '0.2em',
          marginBottom: '6cqw',
        }}
      >
        {placeholderCardData.event.title}
      </p>

      <p
        className="leading-snug text-balance"
        style={{
          color: 'var(--card-primary)',
          fontFamily: 'var(--card-font-display)',
          fontSize: 'calc(11cqw * var(--card-text-scale))',
          letterSpacing: 'var(--card-tracking-display)',
          paddingInline: '8cqw',
        }}
      >
        {PREVIEW_NAMES}
      </p>

      {/*
        A hairline in the theme's own border colour, with the theme's own
        width — `tiada` and `ornamen` both set it to 0, so a theme that draws
        no rules does not get one here either.
      */}
      <span
        className="block"
        style={{
          borderTopStyle: 'solid',
          borderTopWidth: 'var(--card-divider-width)',
          borderTopColor: 'var(--card-border)',
          marginBlock: '6cqw',
          width: '18cqw',
        }}
      />

      <p
        style={{
          color: 'var(--card-text)',
          fontFamily: 'var(--card-font-body)',
          fontSize: '5cqw',
        }}
      >
        {PREVIEW_DATE}
      </p>
    </div>
  );
}

export default TemplatePreview;
