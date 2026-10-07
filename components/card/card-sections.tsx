/**
 * The blocks a card is built from — one component per `SectionId`.
 *
 * `sectionRegistry` is the mechanism that replaces per-template code. The
 * renderer walks `theme.layout.sections`, looks each id up here and renders it;
 * a template changes which blocks appear and in what order by listing different
 * ids in its JSON. No component in this file knows which template it is being
 * rendered for, and none of them reads `theme.name`.
 *
 * Each entry also carries `hasContent`. A theme may list `doa` while a couple
 * wrote no prayer, and an empty heading with a divider under it looks like a
 * bug to a guest — so a section with nothing to say is dropped before any
 * divider is placed, not rendered empty.
 *
 * Images are plain `<img>` on purpose; see the comment at `Photo` below.
 */
import type { ReactElement } from 'react';
import type { CardData, CardImage, Person } from '@/lib/card-schema';
import type { SectionId, Theme } from '@/lib/theme-schema';
import {
  displayName,
  formatCardDate,
  formatCardDateShort,
  formatTimeRange,
  orderedCouple,
  parentsLine,
} from './card-format';

export type SectionProps = {
  data: CardData;
  theme: Theme;
};

type SectionEntry = {
  /** Renders the block. Only called when `hasContent` is true. */
  component: (props: SectionProps) => ReactElement;
  /** Does this card hold anything for this block? */
  hasContent: (data: CardData) => boolean;
};

/** Sections whose content is the couple's own, so they always have something. */
const always = () => true;

/* -------------------------------------------------------------------------- */
/* Shared pieces                                                              */
/* -------------------------------------------------------------------------- */

function Heading({ children }: { children: string }) {
  return (
    <h2
      className="text-xs font-semibold uppercase"
      style={{
        color: 'var(--card-primary)',
        fontFamily: 'var(--card-font-heading)',
        letterSpacing: '0.18em',
      }}
    >
      {children}
    </h2>
  );
}

/**
 * A card image.
 *
 * `next/image` is deliberately not used. Its optimiser is a server route
 * (`/_next/image`), so every photo on a supposedly static card would depend on
 * the app being up — and the one architectural promise of `/kad/[slug]` is that
 * it still opens on the morning of the wedding if the app or the database is
 * down (SPEC.md → architecture decision 1). A plain `<img>` pointing at the
 * storage URL keeps that promise.
 */
function Photo({
  image,
  className,
  priority = false,
}: {
  image: CardImage;
  className?: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- see Photo's docblock
    <img
      src={image.url}
      alt={image.alt ?? ''}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}

function PersonBlock({ person }: { person: Person }) {
  const parents = parentsLine(person);

  return (
    <div>
      <p
        className="text-xl leading-snug"
        style={{
          color: 'var(--card-primary)',
          fontFamily: 'var(--card-font-heading)',
          letterSpacing: 'var(--card-tracking-heading)',
        }}
      >
        {person.name}
      </p>
      {parents !== undefined && (
        <p className="mt-1 text-sm" style={{ color: 'var(--card-muted)' }}>
          Anak kepada {parents}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* pembuka — the cover                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The cover. `theme.layout.cover` chooses the composition:
 *
 * - `tengah` — names centred, the cover photo above them as a round portrait
 * - `atas`   — the photo as a wide block at the top, names beneath it
 * - `penuh`  — the photo full-bleed behind the names
 *
 * This switch is over a theme *setting*, not a template identity. Adding a
 * fourth composition means adding a value to `coverStyleSchema` and a branch
 * here — once, for every template that asks for it.
 */
function Pembuka({ data, theme }: SectionProps) {
  const [first, second] = orderedCouple(data.couple);
  const cover = data.photos.cover;
  const style = theme.layout.cover;

  const names = (
    <div>
      {data.event.title !== undefined && (
        <p
          className="mb-4 text-xs uppercase"
          style={{ color: 'var(--card-muted)', letterSpacing: '0.22em' }}
        >
          {data.event.title}
        </p>
      )}
      <h1
        className="text-3xl leading-tight sm:text-4xl"
        style={{
          color: 'var(--card-primary)',
          fontFamily: 'var(--card-font-display)',
          letterSpacing: 'var(--card-tracking-display)',
        }}
      >
        {displayName(first)} <span style={{ color: 'var(--card-accent)' }}>&amp;</span>{' '}
        {displayName(second)}
      </h1>
      {data.greeting !== undefined && (
        <p className="mt-5 text-sm leading-relaxed" style={{ color: 'var(--card-text)' }}>
          {data.greeting}
        </p>
      )}
    </div>
  );

  if (style === 'penuh' && cover !== undefined) {
    return (
      <section data-section="pembuka" className="relative isolate overflow-hidden">
        <Photo
          image={cover}
          priority
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 -z-10"
          style={{ backgroundColor: 'var(--card-surface)', opacity: 0.78 }}
        />
        <div className="px-2 py-16 text-center">{names}</div>
      </section>
    );
  }

  if (style === 'atas' && cover !== undefined) {
    return (
      <section data-section="pembuka">
        <Photo
          image={cover}
          priority
          className="h-56 w-full object-cover"
          /* radius comes from the theme, not from this component */
        />
        <div className="pt-8">{names}</div>
      </section>
    );
  }

  return (
    <section data-section="pembuka" className="text-center">
      {cover !== undefined && (
        <Photo
          image={cover}
          priority
          className="mx-auto mb-8 h-40 w-40 rounded-full object-cover"
        />
      )}
      {names}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* The remaining blocks                                                       */
/* -------------------------------------------------------------------------- */

function Pengantin({ data }: SectionProps) {
  const [first, second] = orderedCouple(data.couple);

  return (
    <section data-section="pengantin">
      <Heading>Pasangan</Heading>
      <div className="mt-4 space-y-6">
        <PersonBlock person={first} />
        <PersonBlock person={second} />
      </div>
    </section>
  );
}

function Tarikh({ data }: SectionProps) {
  const { event } = data;

  return (
    <section data-section="tarikh">
      <Heading>Tarikh</Heading>
      <p
        className="mt-4 text-lg"
        style={{ color: 'var(--card-primary)', fontFamily: 'var(--card-font-heading)' }}
      >
        <time dateTime={event.date}>{formatCardDate(event.date)}</time>
      </p>
      {event.hijriDate !== undefined && (
        <p className="mt-1 text-sm" style={{ color: 'var(--card-muted)' }}>
          {event.hijriDate}
        </p>
      )}
      <p className="mt-3 text-base">{formatTimeRange(event.startTime, event.endTime)}</p>
    </section>
  );
}

/**
 * The venue, written out. The Google Maps and Waze links are task B7, which has
 * to work from a written address alone when no coordinates were given — so the
 * link building lives there, with its own tests, rather than being half-done
 * here.
 */
function Lokasi({ data }: SectionProps) {
  const { venue } = data;
  const locality = [venue.postcode, venue.city, venue.state]
    .filter((part): part is string => part !== undefined)
    .join(' ');

  return (
    <section data-section="lokasi">
      <Heading>Lokasi</Heading>
      <p
        className="mt-4 text-lg"
        style={{ color: 'var(--card-primary)', fontFamily: 'var(--card-font-heading)' }}
      >
        {venue.name}
      </p>
      <address className="mt-2 text-sm leading-relaxed not-italic">
        {venue.addressLines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
        {locality !== '' && <span className="block">{locality}</span>}
      </address>
    </section>
  );
}

function AturCara({ data }: SectionProps) {
  return (
    <section data-section="aturcara">
      <Heading>Atur Cara</Heading>
      <ul className="mt-4 space-y-3">
        {data.programme.map((item) => (
          <li
            key={`${item.time}-${item.title}`}
            className="flex gap-4 border-b pb-3 last:border-b-0 last:pb-0"
            style={{
              borderBottomColor: 'var(--card-border)',
              borderBottomWidth: 'var(--card-divider-width)',
            }}
          >
            <span
              className="w-20 shrink-0 text-sm tabular-nums"
              style={{ color: 'var(--card-accent)' }}
            >
              {item.time}
            </span>
            <span className="text-sm">
              {item.title}
              {item.note !== undefined && (
                <span className="mt-0.5 block" style={{ color: 'var(--card-muted)' }}>
                  {item.note}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Doa({ data }: SectionProps) {
  const prayer = data.prayer;
  if (prayer === undefined) throw new Error('Doa rendered without prayer data.');

  return (
    <section data-section="doa" className="text-center">
      <blockquote
        className="text-base leading-loose"
        style={{ fontFamily: 'var(--card-font-heading)' }}
      >
        {prayer.text}
      </blockquote>
      {prayer.source !== undefined && (
        <p className="mt-3 text-xs" style={{ color: 'var(--card-muted)' }}>
          {prayer.source}
        </p>
      )}
    </section>
  );
}

function Galeri({ data }: SectionProps) {
  return (
    <section data-section="galeri">
      <Heading>Galeri</Heading>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.photos.gallery.map((image) => (
          <Photo
            key={image.url}
            image={image}
            className="aspect-square w-full object-cover"
          />
        ))}
      </div>
    </section>
  );
}

function Hubungi({ data }: SectionProps) {
  return (
    <section data-section="hubungi">
      <Heading>Hubungi</Heading>
      <ul className="mt-4 space-y-3">
        {data.contacts.map((contact) => (
          <li key={`${contact.name}-${contact.phone}`} className="text-sm">
            <span className="block">{contact.name}</span>
            {contact.role !== undefined && (
              <span className="block text-xs" style={{ color: 'var(--card-muted)' }}>
                {contact.role}
              </span>
            )}
            <a
              href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
              className="mt-1 inline-block underline"
              style={{ color: 'var(--card-primary)' }}
            >
              {contact.phone}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The RSVP block — heading and deadline only.
 *
 * The form itself is task B8, and it cannot be written yet for a second reason
 * beyond scope: the PDPA consent notice that has to sit on it is task C6a and
 * must be reviewed by a human. Nothing here invents that text.
 */
function Rsvp({ data }: SectionProps) {
  return (
    <section
      data-section="rsvp"
      id="rsvp"
      className="px-5 py-6"
      style={{
        backgroundColor: 'var(--card-surface)',
        borderRadius: 'var(--card-radius)',
        borderColor: 'var(--card-border)',
        borderWidth: 'var(--card-divider-width)',
      }}
    >
      <Heading>Kehadiran</Heading>
      {data.rsvpDeadline !== undefined && (
        <p className="mt-3 text-sm" style={{ color: 'var(--card-muted)' }}>
          Sila jawab sebelum {formatCardDateShort(data.rsvpDeadline)}.
        </p>
      )}
    </section>
  );
}

/**
 * The wishes block. Like `rsvp` this is a container for what guests submit, so
 * it renders its heading with no card data behind it; task B9 fills it.
 */
function Ucapan() {
  return (
    <section data-section="ucapan" id="ucapan">
      <Heading>Ucapan</Heading>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Registry                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Every section the schema allows, keyed by id. `Record<SectionId, …>` means
 * adding a value to `sectionIdSchema` without a block here fails typecheck —
 * a theme can never name a section the renderer silently drops.
 */
export const sectionRegistry: Record<SectionId, SectionEntry> = {
  pembuka: { component: Pembuka, hasContent: always },
  pengantin: { component: Pengantin, hasContent: always },
  tarikh: { component: Tarikh, hasContent: always },
  lokasi: { component: Lokasi, hasContent: always },
  aturcara: { component: AturCara, hasContent: (data) => data.programme.length > 0 },
  doa: { component: Doa, hasContent: (data) => data.prayer !== undefined },
  galeri: { component: Galeri, hasContent: (data) => data.photos.gallery.length > 0 },
  hubungi: { component: Hubungi, hasContent: (data) => data.contacts.length > 0 },
  rsvp: { component: Rsvp, hasContent: always },
  ucapan: { component: Ucapan, hasContent: always },
};

/**
 * The sections this card actually renders: the theme's order, minus the blocks
 * this couple left empty.
 */
export function visibleSections(data: CardData, theme: Theme): SectionId[] {
  return theme.layout.sections.filter((id) => sectionRegistry[id].hasContent(data));
}
