/**
 * Theme → CSS. The one place a `Theme` (`lib/theme-schema.ts`) becomes style.
 *
 * The renderer reads colours, fonts and shapes only through the custom
 * properties built here. That is what keeps `components/card/` free of
 * per-template code: a new template is a new JSON file whose values land in
 * these variables, and every section already draws from them.
 *
 * Nothing in this module looks at `theme.name`. The name is a label for the
 * designer and for the gallery; branching on it would be the per-template
 * special-casing the whole design exists to prevent.
 */
import type { CSSProperties } from 'react';
import type {
  Background,
  CornerStyle,
  DividerStyle,
  Font,
  Theme,
} from '@/lib/theme-schema';

/* -------------------------------------------------------------------------- */
/* Shapes                                                                     */
/* -------------------------------------------------------------------------- */

/** Corner radius per theme corner style. */
const RADIUS: Record<CornerStyle, string> = {
  tajam: '0px',
  bulat: '0.875rem',
  lengkung: '2rem',
};

/** Hairline width per divider style. `ornamen` draws a glyph, not a rule. */
const DIVIDER_WIDTH: Record<DividerStyle, string> = {
  tiada: '0px',
  garis: '1px',
  ornamen: '0px',
};

/* -------------------------------------------------------------------------- */
/* Colour                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * `#abc` or `#aabbcc` plus an alpha → an `rgb(… / …)` string.
 *
 * Needed because two background kinds veil an image with a translucent colour,
 * and a background *image* cannot carry opacity on its own — the veil has to
 * be a gradient layer stacked over it.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const body = hex.slice(1);
  const full =
    body.length === 3
      ? body
          .split('')
          .map((char) => char + char)
          .join('')
      : body;

  const value = Number.parseInt(full, 16);
  const red = (value >> 16) & 0xff;
  const green = (value >> 8) & 0xff;
  const blue = value & 0xff;

  return `rgb(${red} ${green} ${blue} / ${alpha})`;
}

/* -------------------------------------------------------------------------- */
/* Background                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The page backdrop as inline style. Every kind sets `backgroundColor` as well
 * as any image, so the card is never a bare white page while the image loads —
 * or if it never loads at all, which matters on wedding-morning mobile data.
 */
export function backgroundStyle(background: Background): CSSProperties {
  switch (background.kind) {
    case 'warna':
      return { backgroundColor: background.color };

    case 'gradien':
      return {
        backgroundColor: background.from,
        backgroundImage: `linear-gradient(${background.angle}deg, ${background.from}, ${background.to})`,
      };

    case 'imej': {
      const image = `url("${background.image}")`;
      const veil =
        background.overlayColor !== undefined && background.overlayOpacity > 0
          ? hexToRgba(background.overlayColor, background.overlayOpacity)
          : undefined;

      return {
        backgroundColor: background.fallbackColor,
        backgroundImage:
          veil === undefined ? image : `linear-gradient(${veil}, ${veil}), ${image}`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }

    case 'corak': {
      const image = `url("${background.image}")`;
      // A tiling pattern dims toward its own base colour rather than toward
      // white, so a dark theme's pattern fades into the dark page.
      const veil =
        background.opacity < 1
          ? hexToRgba(background.color, 1 - background.opacity)
          : undefined;

      return {
        backgroundColor: background.color,
        backgroundImage:
          veil === undefined ? image : `linear-gradient(${veil}, ${veil}), ${image}`,
        backgroundSize:
          veil === undefined
            ? `${background.tileSize}px auto`
            : `auto, ${background.tileSize}px auto`,
        backgroundRepeat: 'repeat',
      };
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Fonts                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The Google Fonts stylesheet a theme needs, or `undefined` when it asks only
 * for system fonts — in which case the card makes no font request at all.
 *
 * This is returned rather than rendered. `/kad/[slug]` is a static page and the
 * stylesheet link belongs in its `<head>` (task B6); a `<link>` emitted from
 * inside the card body would load late and flash unstyled text.
 */
export function googleFontsHref(theme: Theme): string | undefined {
  const families = new Map<string, Set<number>>();

  for (const font of [theme.fonts.heading, theme.fonts.body, theme.fonts.display]) {
    if (font?.googleFont === undefined) continue;

    const weights = families.get(font.googleFont) ?? new Set<number>();
    for (const weight of font.weights) weights.add(weight);
    families.set(font.googleFont, weights);
  }

  if (families.size === 0) return undefined;

  const query = [...families.entries()]
    .map(([family, weights]) => {
      const list = [...weights].sort((a, b) => a - b).join(';');

      return `family=${family.trim().replace(/\s+/g, '+')}:wght@${list}`;
    })
    .join('&');

  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}

/** `letterSpacing` is in em in the schema; CSS needs the unit. */
function tracking(font: Font): string {
  return font.letterSpacing === undefined ? 'normal' : `${font.letterSpacing}em`;
}

/* -------------------------------------------------------------------------- */
/* Custom properties                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Every theme value the renderer uses, as custom properties on the card root,
 * merged with the page background.
 *
 * React's `CSSProperties` has no index signature for `--*`, so the record is
 * built as strings and cast once here. React passes custom properties through
 * to the DOM unchanged.
 */
export function cardStyle(theme: Theme): CSSProperties {
  const { palette, fonts, layout } = theme;

  const variables: Record<string, string> = {
    '--card-background': palette.background,
    '--card-surface': palette.surface,
    '--card-text': palette.text,
    '--card-muted': palette.muted,
    '--card-primary': palette.primary,
    '--card-accent': palette.accent,
    '--card-border': palette.border,
    '--card-on-primary': palette.onPrimary,

    '--card-font-heading': fonts.heading.family,
    '--card-font-body': fonts.body.family,
    // The display face is for the couple's names on the cover only; a theme
    // that omits it falls back to its heading face rather than to the browser.
    '--card-font-display': (fonts.display ?? fonts.heading).family,
    '--card-tracking-heading': tracking(fonts.heading),
    '--card-tracking-display': tracking(fonts.display ?? fonts.heading),

    '--card-radius': RADIUS[layout.corners],
    '--card-divider-width': DIVIDER_WIDTH[layout.divider],
    '--card-text-scale': String(layout.textScale),
  };

  return { ...variables, ...backgroundStyle(theme.background) } as CSSProperties;
}
