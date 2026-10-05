/**
 * Presentation helpers for the card renderer.
 *
 * Everything here turns stored card data (`lib/card-schema.ts`) into the exact
 * string a guest reads. Two rules hold throughout:
 *
 * 1. **No `Intl`.** Month and weekday names are spelled out below rather than
 *    asked of `Intl.DateTimeFormat('ms-MY')`. A card page is prerendered on
 *    whatever machine runs `next build`, and a Node build without full ICU
 *    silently falls back to English — the card would ship saying "March". A
 *    hard-coded table cannot drift between environments.
 * 2. **No invented prose.** These functions arrange names, dates and times.
 *    Any sentence a guest reads that is not a date is typed by the couple
 *    (`greeting`, `prayer.text`) or is a section heading in the renderer.
 */
import type { Couple, Person } from '@/lib/card-schema';

/** Index 0 is Sunday, matching `Date.prototype.getUTCDay`. */
const WEEKDAYS = [
  'Ahad',
  'Isnin',
  'Selasa',
  'Rabu',
  'Khamis',
  'Jumaat',
  'Sabtu',
] as const;

const MONTHS = [
  'Januari',
  'Februari',
  'Mac',
  'April',
  'Mei',
  'Jun',
  'Julai',
  'Ogos',
  'September',
  'Oktober',
  'November',
  'Disember',
] as const;

type DateParts = { year: number; month: number; day: number };

/**
 * Splits a `YYYY-MM-DD` string. The schema has already proven the shape and
 * that the day exists in the calendar, so this does no validation — it is
 * called on parsed card data only.
 */
function dateParts(iso: string): DateParts {
  const [year, month, day] = iso.split('-').map(Number) as [number, number, number];

  return { year, month, day };
}

/** `2027-03-14` → `14 Mac 2027`. */
export function formatCardDateShort(iso: string): string {
  const { year, month, day } = dateParts(iso);

  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** `2027-03-14` → `Sabtu, 14 Mac 2027`. */
export function formatCardDate(iso: string): string {
  const { year, month, day } = dateParts(iso);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];

  return `${weekday}, ${formatCardDateShort(iso)}`;
}

/**
 * The Malay part of day. Boundaries follow everyday Malaysian usage rather
 * than a 6/12/18 split: 12 noon is `tengah hari` on its own, and the evening
 * turns to `malam` at 7, not at sunset.
 */
export function partOfDay(hour: number): string {
  if (hour === 0) return 'tengah malam';
  if (hour < 12) return 'pagi';
  if (hour === 12) return 'tengah hari';
  if (hour < 19) return 'petang';

  return 'malam';
}

/**
 * `14:30` → `2.30 petang`. A dot separates hour from minute, which is how
 * time is written on a Malaysian invitation — not a colon.
 */
export function formatCardTime(time: string): string {
  const [hour, minute] = time.split(':').map(Number) as [number, number];
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  return `${hour12}.${String(minute).padStart(2, '0')} ${partOfDay(hour)}`;
}

/** `11:00`–`16:00` → `11.00 pagi – 4.00 petang`. */
export function formatTimeRange(startTime: string, endTime?: string): string {
  const start = formatCardTime(startTime);

  return endTime === undefined ? start : `${start} – ${formatCardTime(endTime)}`;
}

/** The short form if the couple gave one, otherwise the full name. */
export function displayName(person: Person): string {
  return person.shortName ?? person.name;
}

/**
 * The parents' line for one side, e.g. `Rahman bin Ismail & Siti binti Omar`.
 * Returns `undefined` when that side named no parents, so the caller omits the
 * line rather than printing a stray ampersand.
 */
export function parentsLine(person: Person): string | undefined {
  const names = [person.parents?.father, person.parents?.mother].filter(
    (name): name is string => name !== undefined,
  );

  return names.length === 0 ? undefined : names.join(' & ');
}

/**
 * Groom and bride in the order the card prints them: the hosting side first.
 *
 * On a Malaysian invitation the family doing the inviting is named first, so
 * the order is a property of the card data (`couple.host`), not of the theme.
 * A theme must never be able to reorder it — that is the kind of decision that
 * would otherwise end up duplicated in every template.
 */
export function orderedCouple(couple: Couple): [Person, Person] {
  return couple.host === 'perempuan'
    ? [couple.bride, couple.groom]
    : [couple.groom, couple.bride];
}
