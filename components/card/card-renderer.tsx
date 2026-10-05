/**
 * The card renderer.
 *
 * It takes two things and nothing else: the card data a couple typed
 * (`lib/card-schema.ts`) and the theme a template is made of
 * (`lib/theme-schema.ts`). There is no template id, no slug, no per-template
 * component — the same function renders every template in the catalogue
 * (CLAUDE.md → "Enjin template").
 *
 * It is a server component with no hooks, no event handlers and no `use client`
 * boundary, so `/kad/[slug]` prerenders to plain HTML and keeps opening when
 * the app or the database is down (SPEC.md → architecture decision 1). Anything
 * added here that needs the client belongs in a child island instead, or the
 * whole page stops being static.
 */
import type { CardData } from '@/lib/card-schema';
import type { Theme } from '@/lib/theme-schema';
import { cardStyle } from './card-theme';
import { sectionRegistry, visibleSections } from './card-sections';

export type CardRendererProps = {
  data: CardData;
  theme: Theme;
};

/** Marks the sections apart. `ornamen` draws a glyph; `tiada` draws nothing. */
function Divider({ theme }: { theme: Theme }) {
  if (theme.layout.divider === 'tiada') return null;

  if (theme.layout.divider === 'ornamen') {
    return (
      <div
        aria-hidden="true"
        data-divider="ornamen"
        className="text-center text-sm"
        style={{ color: 'var(--card-accent)', letterSpacing: '0.6em' }}
      >
        &#10022;
      </div>
    );
  }

  return (
    <hr
      data-divider="garis"
      className="mx-auto w-16 border-0"
      style={{
        borderTopStyle: 'solid',
        borderTopWidth: 'var(--card-divider-width)',
        borderTopColor: 'var(--card-border)',
      }}
    />
  );
}

export function CardRenderer({ data, theme }: CardRendererProps) {
  const sections = visibleSections(data, theme);

  return (
    <article
      data-naeqah-card=""
      lang="ms"
      style={cardStyle(theme)}
      className="min-h-dvh w-full"
    >
      <div
        className="mx-auto w-full max-w-md px-6 py-12"
        style={{
          color: 'var(--card-text)',
          fontFamily: 'var(--card-font-body)',
          // Mobile-first base, scaled by the theme rather than by a breakpoint.
          fontSize: 'calc(1rem * var(--card-text-scale))',
          textAlign: theme.layout.centerBody ? 'center' : 'start',
        }}
      >
        {sections.map((id, index) => {
          const Section = sectionRegistry[id].component;

          return (
            <div key={id}>
              {index > 0 && (
                <div className="py-8">
                  <Divider theme={theme} />
                </div>
              )}
              <Section data={data} theme={theme} />
            </div>
          );
        })}

        {theme.showBranding && (
          <p className="mt-14 text-center text-xs" style={{ color: 'var(--card-muted)' }}>
            Dibuat dengan Naeqah
          </p>
        )}
      </div>
    </article>
  );
}

export default CardRenderer;
