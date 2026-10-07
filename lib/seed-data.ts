/**
 * The fixture `npm run db:seed` writes: one template and one example card.
 *
 * It lives in `lib/` rather than inside `scripts/seed.ts` so it can be unit
 * tested without a database — the card is parsed through `cardDataSchema` at
 * module load, so a schema change that this fixture no longer satisfies breaks
 * the test suite instead of breaking the seed on someone's laptop.
 *
 * Everything here is deliberately fictional. Two rules from CLAUDE.md apply:
 *
 *  - **No invented real values.** `bookings.price_sen` is 0, not a guessed
 *    ringgit figure: `docs/SPEC.md` says tier pricing is not decided, and the
 *    seed booking records an example, never a charge that happened.
 *  - **No real contact details.** The e-mail uses the reserved `.test` TLD so
 *    it can never receive mail, and the phone numbers have an all-zero
 *    subscriber part so a guest tapping one never reaches a stranger.
 */
import { parseCardData, type CardData } from '@/lib/card-schema';
import type { Tier } from '@/lib/db/schema';

/* -------------------------------------------------------------------------- */
/* Template                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The first template. `themeFile` must be a key of `themeRegistry`
 * (`lib/themes/index.ts`); there is a test asserting that.
 *
 * `status: 'published'` because the gallery in task A6 reads published rows
 * only, and a catalogue with nothing in it would make that page untestable.
 * The look itself is functional, not final — task A5b replaces it.
 */
export const SEED_TEMPLATE = {
  slug: 'klasik',
  name: 'Klasik',
  tier: 'asas' as Tier,
  themeFile: 'lib/themes/klasik.json',
  status: 'published' as const,
  sortOrder: 0,
} as const;

/* -------------------------------------------------------------------------- */
/* Account and booking                                                        */
/* -------------------------------------------------------------------------- */

/** Reserved TLD (RFC 2606) — this address can never be delivered to. */
export const SEED_USER_EMAIL = 'contoh@naeqah.test';

export const SEED_USER_NAME = 'Akaun Contoh';

/**
 * Zero sen. Prices are not decided (`docs/SPEC.md`), and `bookings.price_sen`
 * records what was actually charged — nothing was. Picking a plausible-looking
 * number here is exactly the invented value CLAUDE.md forbids, and it would
 * leak into any report that sums this column.
 */
export const SEED_BOOKING_PRICE_SEN = 0;

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

/** The slug the example card is published under (`docs/BACKLOG.md` → A5). */
export const SEED_CARD_SLUG = 'contoh-aqeef-nurul';

/**
 * The example card.
 *
 * Distinct from `placeholderCardData` (`components/card/placeholder-card.ts`)
 * on purpose: that one is the stand-in the gallery shows for a template with
 * no couple behind it, this one is a row in the database. Seeing the same two
 * names in both places would hide a wiring mistake between them.
 *
 * No photos, for the same reason the placeholder has none: every image needs a
 * file in `public/`, and the licensed assets arrive with task A5b. A seed card
 * that renders broken-image icons is worse than one that renders text.
 */
export const seedCardData: CardData = parseCardData({
  couple: {
    host: 'bersama',
    groom: {
      name: 'Muhammad Aqeef bin Rahman',
      shortName: 'Aqeef',
      parents: { father: 'Rahman bin Osman', mother: 'Zaiton binti Ismail' },
    },
    bride: {
      name: 'Nurul Hidayah binti Kamal',
      shortName: 'Nurul',
      parents: { father: 'Kamal bin Harun', mother: 'Rosnah binti Abdullah' },
    },
  },
  event: {
    title: 'Walimatulurus',
    date: '2027-08-14',
    startTime: '11:30',
    endTime: '16:00',
  },
  venue: {
    name: 'Dewan Seri Kenangan',
    addressLines: ['Jalan Seri Kenangan 1', 'Seksyen 9'],
    city: 'Shah Alam',
    state: 'Selangor',
    postcode: '40100',
  },
  greeting:
    'Dengan penuh rasa kesyukuran, kami menjemput tuan/puan hadir ke majlis perkahwinan anak kami.',
  programme: [
    { time: '11:30', title: 'Ketibaan tetamu' },
    { time: '12:30', title: 'Ketibaan pengantin' },
    { time: '13:00', title: 'Jamuan makan' },
    { time: '16:00', title: 'Majlis berakhir' },
  ],
  prayer: {
    text: 'Semoga Allah mengurniakan keberkatan kepada pasangan ini, dan menghimpunkan mereka dalam kebaikan.',
    source: 'Doa',
  },
  contacts: [
    { name: 'Rahman', phone: '012-000 0000', role: 'Bapa pengantin lelaki' },
    { name: 'Rosnah', phone: '019-000 0000', role: 'Ibu pengantin perempuan' },
  ],
  rsvpDeadline: '2027-07-31',
});

/**
 * The value for `cards.event_date`. Denormalised from `data` rather than typed
 * twice — a card whose column disagreed with its JSON would be invisible to
 * the retention job (task C7) while still rendering.
 */
export const SEED_CARD_EVENT_DATE = seedCardData.event.date;
