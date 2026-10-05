/**
 * Theme schema — the fixed shape of one template's look.
 *
 * A template is a JSON file at `lib/themes/<slug>.json` validated by this
 * schema, never a React component (CLAUDE.md → "Enjin template"). Adding a
 * template means adding one JSON file and its assets; the renderer in
 * `components/card/` (task A4) reads this plus `lib/card-schema.ts` and
 * contains no per-template branches.
 *
 * What belongs here: colours, the font pairing, the layout decisions and the
 * background. What does not: anything a couple types (that is card data), and
 * the template's slug, name-in-the-gallery and tier — those are columns on the
 * `templates` table, so duplicating them in the JSON would let the two drift.
 */
import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/* Primitives                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * A hex colour, `#rgb` or `#rrggbb`. Deliberately narrow: designers hand over
 * hex, and a single accepted form means the renderer never has to guess
 * whether it can interpolate a value into a CSS gradient.
 */
export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    error: 'Warna mesti kod hex, contoh #1a1a1a atau #abc.',
  });

/** Asset path inside the repo, or an absolute URL for a hosted image. */
export const assetRefSchema = z
  .string()
  .trim()
  .min(1, { error: 'Rujukan aset tidak boleh kosong.' })
  .refine((value) => value.startsWith('/') || /^https?:\/\//.test(value), {
    error: 'Rujukan aset mesti bermula dengan "/" atau "http".',
  });

/** CSS font weights, 100–900 in hundreds. */
export const fontWeightSchema = z
  .number()
  .int()
  .multipleOf(100, { error: 'Berat font mesti gandaan 100.' })
  .min(100, { error: 'Berat font mesti antara 100 dan 900.' })
  .max(900, { error: 'Berat font mesti antara 100 dan 900.' });

/* -------------------------------------------------------------------------- */
/* Palette                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Every colour the renderer may use. All seven are required: a theme that
 * leaves one out would force the renderer to invent a fallback, and that is
 * exactly the per-template special-casing this design exists to prevent.
 */
export const paletteSchema = z.strictObject({
  /** Page background behind everything. */
  background: hexColorSchema,
  /** Cards, panels and the RSVP form sitting on the background. */
  surface: hexColorSchema,
  /** Body text. Must read against both `background` and `surface`. */
  text: hexColorSchema,
  /** Secondary text: captions, labels, the footer line. */
  muted: hexColorSchema,
  /** Headings, the couple's names, primary buttons. */
  primary: hexColorSchema,
  /** Ornaments, dividers, small highlights. */
  accent: hexColorSchema,
  /** Hairlines and input borders. */
  border: hexColorSchema,
  /** Text placed on top of `primary`, e.g. inside a filled button. */
  onPrimary: hexColorSchema,
});

/* -------------------------------------------------------------------------- */
/* Fonts                                                                      */
/* -------------------------------------------------------------------------- */

export const fontSchema = z.strictObject({
  /**
   * CSS `font-family` value, including its fallbacks — the renderer drops it
   * into a custom property unchanged.
   */
  family: z
    .string()
    .trim()
    .min(1, { error: 'Keluarga font tidak boleh kosong.' })
    .max(200),
  /**
   * Google Fonts family name to load, when the font is not a system stack.
   * Omit it for system fonts so no network request is made.
   */
  googleFont: z.string().trim().max(80).optional(),
  /** Weights the theme actually uses. Loading more slows the card down. */
  weights: z
    .array(fontWeightSchema)
    .min(1, { error: 'Sekurang-kurangnya satu berat font diperlukan.' })
    .max(4, { error: 'Tidak boleh melebihi 4 berat font setiap keluarga.' })
    .refine((weights) => new Set(weights).size === weights.length, {
      error: 'Berat font tidak boleh berulang.',
    }),
  /** Tracking in em, for display faces that need loosening. */
  letterSpacing: z.number().min(-0.1).max(0.5).optional(),
});

/** The font pairing: one face for headings, one for running text. */
export const fontsSchema = z.strictObject({
  heading: fontSchema,
  body: fontSchema,
  /**
   * Optional third face for the couple's names on the cover only. Falls back
   * to `heading` in the renderer.
   */
  display: fontSchema.optional(),
});

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The blocks a card is built from. Bahasa Malaysia, because these ids appear
 * in theme JSON that a non-programmer designer edits.
 */
export const sectionIdSchema = z.enum([
  'pembuka',
  'pengantin',
  'tarikh',
  'lokasi',
  'aturcara',
  'doa',
  'galeri',
  'hubungi',
  'rsvp',
  'ucapan',
]);

/** How the cover composes. */
export const coverStyleSchema = z.enum(['tengah', 'atas', 'penuh']);

export const cornerStyleSchema = z.enum(['tajam', 'bulat', 'lengkung']);

export const dividerStyleSchema = z.enum(['tiada', 'garis', 'ornamen']);

export const layoutSchema = z.strictObject({
  cover: coverStyleSchema,
  /**
   * Which blocks the card shows, in order. `pembuka` must come first and
   * `rsvp` must be present — a card with no way to reply is the one thing the
   * couple is paying for (SPEC.md → "Lorong tetamu tanpa geseran").
   */
  sections: z
    .array(sectionIdSchema)
    .min(1, { error: 'Sekurang-kurangnya satu seksyen diperlukan.' })
    .refine((sections) => new Set(sections).size === sections.length, {
      error: 'Seksyen tidak boleh berulang.',
    })
    .refine((sections) => sections[0] === 'pembuka', {
      error: 'Seksyen pertama mesti "pembuka".',
    })
    .refine((sections) => sections.includes('rsvp'), {
      error: 'Seksyen "rsvp" wajib ada.',
    }),
  corners: cornerStyleSchema,
  divider: dividerStyleSchema,
  /** Body text scale multiplier, applied on top of the mobile-first base. */
  textScale: z.number().min(0.8).max(1.4).default(1),
  /** Centre the running text, not just the headings. */
  centerBody: z.boolean().default(false),
});

/* -------------------------------------------------------------------------- */
/* Background                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The page backdrop. A discriminated union rather than a bag of optional
 * fields, so a theme cannot declare both a gradient and an image and leave
 * the renderer to pick.
 */
export const backgroundSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('warna'),
    color: hexColorSchema,
  }),
  z.strictObject({
    kind: z.literal('gradien'),
    from: hexColorSchema,
    to: hexColorSchema,
    /** Degrees, clockwise from "to top". */
    angle: z.number().min(0).max(360).default(180),
  }),
  z.strictObject({
    kind: z.literal('imej'),
    image: assetRefSchema,
    /** Flat colour behind the image while it loads. */
    fallbackColor: hexColorSchema,
    /** Veil over the image so text stays readable. */
    overlayColor: hexColorSchema.optional(),
    overlayOpacity: z.number().min(0).max(1).default(0),
  }),
  z.strictObject({
    kind: z.literal('corak'),
    /** Tiling image. */
    image: assetRefSchema,
    color: hexColorSchema,
    /** Tile width in px; height follows the image's aspect ratio. */
    tileSize: z.number().int().min(8).max(1024).default(240),
    opacity: z.number().min(0).max(1).default(1),
  }),
]);

/* -------------------------------------------------------------------------- */
/* The theme                                                                  */
/* -------------------------------------------------------------------------- */

export const themeSchema = z.strictObject({
  /**
   * Bumped when this schema changes in a way old files cannot satisfy. Themes
   * are hand-written JSON, so the version is what tells a future session
   * whether a file predates a change.
   */
  version: z.literal(1),
  /** Designer-facing label. The gallery name lives on `templates.name`. */
  name: z
    .string()
    .trim()
    .min(1, { error: 'Nama tema tidak boleh kosong.' })
    .max(80, { error: 'Nama tema terlalu panjang (maksimum 80 aksara).' }),
  palette: paletteSchema,
  fonts: fontsSchema,
  layout: layoutSchema,
  background: backgroundSchema,
  /** Ornament placed above the cover, e.g. a drawn floral motif. */
  ornament: assetRefSchema.optional(),
  /**
   * Shows the "Dibuat dengan Naeqah" footer line. The `asas` tier sets this;
   * it is the main growth channel (SPEC.md → tier table), so it is explicit
   * in the theme rather than inferred.
   */
  showBranding: z.boolean().default(true),
});

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type HexColor = z.infer<typeof hexColorSchema>;
export type AssetRef = z.infer<typeof assetRefSchema>;
export type Palette = z.infer<typeof paletteSchema>;
export type Font = z.infer<typeof fontSchema>;
export type Fonts = z.infer<typeof fontsSchema>;
export type SectionId = z.infer<typeof sectionIdSchema>;
export type CoverStyle = z.infer<typeof coverStyleSchema>;
export type CornerStyle = z.infer<typeof cornerStyleSchema>;
export type DividerStyle = z.infer<typeof dividerStyleSchema>;
export type Layout = z.infer<typeof layoutSchema>;
export type Background = z.infer<typeof backgroundSchema>;

/** A theme after parsing — every defaulted field is present. */
export type Theme = z.infer<typeof themeSchema>;

/** A theme as written in `lib/themes/<slug>.json`. */
export type ThemeInput = z.input<typeof themeSchema>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Throws a `ZodError`. Use when loading a theme file at build time. */
export function parseTheme(input: unknown): Theme {
  return themeSchema.parse(input);
}

/** Never throws. */
export function safeParseTheme(input: unknown) {
  return themeSchema.safeParse(input);
}

/** True when `input` is a complete, valid theme. */
export function isTheme(input: unknown): input is Theme {
  return themeSchema.safeParse(input).success;
}
