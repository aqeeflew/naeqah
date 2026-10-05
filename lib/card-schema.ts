/**
 * Card data schema — the fixed shape of one wedding invitation.
 *
 * This is the contract between the editor (task A7), the renderer
 * (`components/card/`, task A4) and `cards.data` in the database. It holds
 * **only** what the couple types in: whose wedding it is, when, where, the
 * order of events, the prayer and the photos. Nothing about how the card
 * *looks* belongs here — that lives in `lib/theme-schema.ts`.
 *
 * Keeping the two apart is what makes a template a configuration record
 * instead of a React component (CLAUDE.md → "Enjin template"). The same card
 * data must render under any theme, and the same theme must render any card.
 *
 * Field names are English (repo convention); domain values that a guest can
 * see — section ids, attendance words — are Bahasa Malaysia, matching the
 * enums in `lib/db/schema.ts`. Validation messages are Bahasa Malaysia
 * because they surface straight in the editor UI.
 */
import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/* Primitives                                                                 */
/* -------------------------------------------------------------------------- */

/** A person's name as it is printed on the card. */
const nameString = z
  .string()
  .trim()
  .min(1, { error: 'Nama tidak boleh kosong.' })
  .max(120, { error: 'Nama terlalu panjang (maksimum 120 aksara).' });

const optionalNameString = nameString.optional();

/**
 * Does the date exist in the calendar? `Date.parse` is no help here — it rolls
 * 2027-02-31 forward to 3 March rather than rejecting it, so compare the parsed
 * components back against what was written.
 */
function isRealCalendarDate(value: string): boolean {
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** `YYYY-MM-DD`. Stored as a plain date — a wedding has no timezone. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Tarikh mesti dalam bentuk YYYY-MM-DD.' })
  .refine(isRealCalendarDate, { error: 'Tarikh itu tidak wujud dalam kalendar.' });

/** 24-hour `HH:MM`. Rendered in Bahasa Malaysia by the renderer, not here. */
export const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
  error: 'Masa mesti dalam bentuk HH:MM (24 jam).',
});

/**
 * An uploaded image. The URL is whatever the storage layer hands back, so it
 * may be absolute or root-relative — both are accepted, nothing else is.
 */
export const imageSchema = z.strictObject({
  url: z
    .string()
    .trim()
    .min(1, { error: 'Pautan gambar tidak boleh kosong.' })
    .refine((value) => value.startsWith('/') || /^https?:\/\//.test(value), {
      error: 'Pautan gambar mesti bermula dengan "/" atau "http".',
    }),
  /** Alt text. Optional, because most couples will not write one. */
  alt: z.string().trim().max(200).optional(),
});

/**
 * Where the venue is on a map. Optional everywhere: task B7 must still build
 * a Maps and Waze link from the written address alone.
 */
export const coordinatesSchema = z.strictObject({
  lat: z
    .number()
    .min(-90, { error: 'Latitud mesti antara -90 dan 90.' })
    .max(90, { error: 'Latitud mesti antara -90 dan 90.' }),
  lng: z
    .number()
    .min(-180, { error: 'Longitud mesti antara -180 dan 180.' })
    .max(180, { error: 'Longitud mesti antara -180 dan 180.' }),
});

/* -------------------------------------------------------------------------- */
/* The couple                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The parents named on the invitation. Both are optional on their own, but a
 * card that names neither side's parents is still valid — some couples host
 * themselves.
 */
export const parentsSchema = z.strictObject({
  father: optionalNameString,
  mother: optionalNameString,
});

export const personSchema = z.strictObject({
  /** Full name, as printed in the body of the card. */
  name: nameString,
  /**
   * Short form for the cover and the browser tab — "Aqeef" rather than
   * "Muhammad Aqeef bin Rahman". Falls back to `name` in the renderer.
   */
  shortName: z.string().trim().max(60).optional(),
  parents: parentsSchema.optional(),
});

/**
 * Who is inviting. Malaysian cards are usually headed by one side's parents;
 * `bersama` means both families invite together.
 */
export const hostSchema = z.enum(['lelaki', 'perempuan', 'bersama']);

export const coupleSchema = z.strictObject({
  groom: personSchema,
  bride: personSchema,
  host: hostSchema.default('bersama'),
});

/* -------------------------------------------------------------------------- */
/* When and where                                                             */
/* -------------------------------------------------------------------------- */

export const eventSchema = z
  .strictObject({
    /** Gregorian ceremony date. Denormalised into `cards.event_date`. */
    date: isoDateSchema,
    /** Free text, e.g. "12 Rejab 1447". Never computed — couples disagree. */
    hijriDate: z.string().trim().max(60).optional(),
    startTime: timeOfDaySchema,
    endTime: timeOfDaySchema.optional(),
    /** Shown above the date block, e.g. "Walimatulurus" or "Akad Nikah". */
    title: z.string().trim().max(80).optional(),
  })
  .refine((event) => event.endTime === undefined || event.endTime > event.startTime, {
    error: 'Masa tamat mesti selepas masa mula.',
    path: ['endTime'],
  });

export const venueSchema = z.strictObject({
  /** Hall, mosque or house name. */
  name: z
    .string()
    .trim()
    .min(1, { error: 'Nama tempat tidak boleh kosong.' })
    .max(160, { error: 'Nama tempat terlalu panjang (maksimum 160 aksara).' }),
  /** Street address, one entry per printed line. */
  addressLines: z
    .array(z.string().trim().min(1).max(160))
    .min(1, { error: 'Alamat tidak boleh kosong.' })
    .max(5, { error: 'Alamat tidak boleh melebihi 5 baris.' }),
  city: z.string().trim().max(80).optional(),
  /**
   * Kept as free text rather than an enum of the thirteen states: a card for
   * a ceremony held abroad must still validate.
   */
  state: z.string().trim().max(60).optional(),
  postcode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, { error: 'Poskod mesti lima digit.' })
    .optional(),
  coordinates: coordinatesSchema.optional(),
});

/* -------------------------------------------------------------------------- */
/* Programme, prayer, photos                                                  */
/* -------------------------------------------------------------------------- */

/** One row of "atur cara majlis". */
export const programmeItemSchema = z.strictObject({
  time: timeOfDaySchema,
  title: z
    .string()
    .trim()
    .min(1, { error: 'Atur cara perlu satu tajuk.' })
    .max(120, { error: 'Tajuk atur cara terlalu panjang (maksimum 120 aksara).' }),
  note: z.string().trim().max(200).optional(),
});

/**
 * The doa or verse printed on the card. `source` is the attribution the
 * couple types — the app never picks a verse on their behalf.
 */
export const prayerSchema = z.strictObject({
  text: z
    .string()
    .trim()
    .min(1, { error: 'Doa tidak boleh kosong.' })
    .max(1200, { error: 'Doa terlalu panjang (maksimum 1200 aksara).' }),
  source: z.string().trim().max(160).optional(),
});

export const photosSchema = z.strictObject({
  /** Hero image behind the cover. */
  cover: imageSchema.optional(),
  /** Pre-wedding gallery. Capped so a card stays fast on mobile data. */
  gallery: z
    .array(imageSchema)
    .max(12, { error: 'Galeri tidak boleh melebihi 12 gambar.' })
    .default([]),
});

/* -------------------------------------------------------------------------- */
/* Contacts                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Who a guest calls with a question. Phone numbers are kept exactly as typed
 * — normalising "012-345 6789" into E.164 would be guessing at a country code
 * the couple never gave.
 */
export const contactSchema = z.strictObject({
  name: nameString,
  phone: z
    .string()
    .trim()
    .min(7, { error: 'Nombor telefon terlalu pendek.' })
    .max(20, { error: 'Nombor telefon terlalu panjang.' })
    .regex(/^[0-9+][0-9\s()+-]*$/, {
      error: 'Nombor telefon hanya boleh mengandungi digit, ruang, +, - dan ( ).',
    }),
  /** Relationship shown next to the name, e.g. "Bapa pengantin lelaki". */
  role: z.string().trim().max(80).optional(),
});

/* -------------------------------------------------------------------------- */
/* The card                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Everything a guest sees, and nothing else. The slug, publish status and
 * expiry live on the `cards` row, not in here.
 */
export const cardSchema = z.strictObject({
  couple: coupleSchema,
  event: eventSchema,
  venue: venueSchema,
  /** Opening line above the couple's names, e.g. "Dengan penuh kesyukuran…". */
  greeting: z.string().trim().max(400).optional(),
  programme: z
    .array(programmeItemSchema)
    .max(20, { error: 'Atur cara tidak boleh melebihi 20 baris.' })
    .default([]),
  prayer: prayerSchema.optional(),
  photos: photosSchema.default({ gallery: [] }),
  contacts: z
    .array(contactSchema)
    .max(4, { error: 'Tidak boleh melebihi 4 nombor untuk dihubungi.' })
    .default([]),
  /** Last date a guest may RSVP. Must not fall after the ceremony. */
  rsvpDeadline: isoDateSchema.optional(),
});

/* -------------------------------------------------------------------------- */
/* Cross-field rules                                                          */
/* -------------------------------------------------------------------------- */

/**
 * `cardSchema` plus the checks that need more than one branch of the object.
 * Parse with this — `cardSchema` on its own is exported for composing partial
 * forms in the editor.
 */
export const cardDataSchema = cardSchema.check((ctx) => {
  const card = ctx.value;

  if (card.rsvpDeadline !== undefined && card.rsvpDeadline > card.event.date) {
    ctx.issues.push({
      code: 'custom',
      input: card.rsvpDeadline,
      path: ['rsvpDeadline'],
      message: 'Tarikh akhir RSVP mesti sebelum atau pada tarikh majlis.',
    });
  }

  const times = card.programme.map((item) => item.time);
  if (times.some((time, i) => i > 0 && time < times[i - 1]!)) {
    ctx.issues.push({
      code: 'custom',
      input: card.programme,
      path: ['programme'],
      message: 'Atur cara mesti disusun mengikut masa menaik.',
    });
  }
});

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type Coordinates = z.infer<typeof coordinatesSchema>;
export type CardImage = z.infer<typeof imageSchema>;
export type Parents = z.infer<typeof parentsSchema>;
export type Person = z.infer<typeof personSchema>;
export type Host = z.infer<typeof hostSchema>;
export type Couple = z.infer<typeof coupleSchema>;
export type CardEvent = z.infer<typeof eventSchema>;
export type Venue = z.infer<typeof venueSchema>;
export type ProgrammeItem = z.infer<typeof programmeItemSchema>;
export type Prayer = z.infer<typeof prayerSchema>;
export type Photos = z.infer<typeof photosSchema>;
export type Contact = z.infer<typeof contactSchema>;

/** Card data after parsing — every defaulted field is present. */
export type CardData = z.infer<typeof cardDataSchema>;

/** Card data as it arrives from a form or from `cards.data`. */
export type CardDataInput = z.input<typeof cardDataSchema>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Throws a `ZodError` listing every problem. Use on trusted-ish input. */
export function parseCardData(input: unknown): CardData {
  return cardDataSchema.parse(input);
}

/** Never throws. Use on anything a guest or a form can reach. */
export function safeParseCardData(input: unknown) {
  return cardDataSchema.safeParse(input);
}

/** True when `input` is a complete, valid card. */
export function isCardData(input: unknown): input is CardData {
  return cardDataSchema.safeParse(input).success;
}
