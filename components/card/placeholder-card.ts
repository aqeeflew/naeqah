/**
 * One complete, fictional card used wherever a theme has to be shown without a
 * real couple behind it: the template gallery and its full preview (task A6),
 * and the renderer's own tests.
 *
 * It is parsed through `cardDataSchema` at module load, so a schema change that
 * this fixture no longer satisfies fails the test suite immediately rather than
 * shipping a broken preview page.
 *
 * **The phone numbers have an all-zero subscriber part**, the same rule
 * `lib/seed-data.ts` sets for the seeded card, and for a sharper reason here:
 * task A6 puts this fixture on a *public* page, where `hubungi` renders each
 * number as a tappable `tel:` link. A plausible-looking Malaysian mobile
 * number on that page is a stranger's phone ringing — CLAUDE.md → "Jangan
 * reka nilai sebenar", in its most literal form. There is a test for it.
 *
 * It carries **no photos**. Every image reference would have to point at a file
 * in `public/`, and the licensed assets arrive with task A5b — a placeholder
 * that renders broken-image icons in the gallery is worse than one that shows
 * the card's text only. Add `photos` here once those assets exist.
 */
import { parseCardData, type CardData } from '@/lib/card-schema';

export const placeholderCardData: CardData = parseCardData({
  couple: {
    host: 'bersama',
    groom: {
      name: 'Ahmad Zulkifli bin Hassan',
      shortName: 'Zulkifli',
      parents: { father: 'Hassan bin Ibrahim', mother: 'Mariam binti Sulaiman' },
    },
    bride: {
      name: 'Nurul Aisyah binti Razak',
      shortName: 'Aisyah',
      parents: { father: 'Razak bin Yusof', mother: 'Halimah binti Daud' },
    },
  },
  event: {
    title: 'Walimatulurus',
    date: '2027-05-15',
    hijriDate: '8 Zulhijjah 1448',
    startTime: '11:00',
    endTime: '16:00',
  },
  venue: {
    name: 'Dewan Serbaguna Taman Melati',
    addressLines: ['Jalan Melati 3', 'Taman Melati'],
    city: 'Kuala Lumpur',
    state: 'Wilayah Persekutuan',
    postcode: '53100',
    coordinates: { lat: 3.2117, lng: 101.7072 },
  },
  greeting:
    'Dengan penuh rasa kesyukuran, kami menjemput tuan/puan untuk hadir ke majlis perkahwinan anak kami.',
  programme: [
    { time: '11:00', title: 'Ketibaan tetamu' },
    { time: '12:30', title: 'Ketibaan pengantin', note: 'Diiringi kompang' },
    { time: '13:00', title: 'Jamuan makan' },
    { time: '16:00', title: 'Majlis berakhir' },
  ],
  prayer: {
    text: 'Ya Allah, berkatilah majlis ini dan satukanlah kami dalam kebaikan.',
    source: 'Doa',
  },
  contacts: [
    { name: 'Hassan', phone: '011-000 0000', role: 'Bapa pengantin lelaki' },
    { name: 'Halimah', phone: '013-000 0000', role: 'Ibu pengantin perempuan' },
  ],
  rsvpDeadline: '2027-05-01',
});
