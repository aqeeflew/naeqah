import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CardRenderer } from '@/components/card';
import { resolveCardPage, type CardPageRow } from './card-page';
import { SEED_CARD_SLUG, SEED_TEMPLATE, seedCardData } from './seed-data';

/** Exactly the shape the join in `publishedCardPage` selects. */
function seedRow(overrides: Partial<CardPageRow> = {}): CardPageRow {
  return {
    slug: SEED_CARD_SLUG,
    // `cards.data` comes back from `jsonb` as a plain object, so round-trip it.
    data: JSON.parse(JSON.stringify(seedCardData)) as unknown,
    themeFile: SEED_TEMPLATE.themeFile,
    ...overrides,
  };
}

describe('resolveCardPage', () => {
  it('turns a published row into the two things the renderer takes', () => {
    const page = resolveCardPage(seedRow());

    expect(page.slug).toBe(SEED_CARD_SLUG);
    expect(page.data.couple.groom.shortName).toBe('Aqeef');
    expect(page.theme.name).toBe('Klasik');
  });

  it('rejects data that is not a card, naming the slug and the field', () => {
    const broken = JSON.parse(JSON.stringify(seedCardData)) as Record<string, unknown>;
    delete broken.venue;

    expect(() => resolveCardPage(seedRow({ data: broken }))).toThrow(
      /Card "contoh-aqeef-nurul" holds data that does not satisfy cardDataSchema at venue/,
    );
  });

  it.each([null, {}, 'bukan kad', 42])('rejects %s outright', (data) => {
    expect(() => resolveCardPage(seedRow({ data }))).toThrow(/does not satisfy/);
  });

  it('rejects a template pointing at an unknown theme', () => {
    expect(() =>
      resolveCardPage(seedRow({ themeFile: 'lib/themes/tiada.json' })),
    ).toThrow(/Unknown theme file/);
  });

  /**
   * The acceptance criterion for A5 is that the seeded card *renders*. The
   * route itself cannot be unit tested without a database, so prove it one
   * step earlier: this is the exact pair `/kad/[slug]` hands to the renderer.
   */
  it('produces a card that renders under the klasik theme', () => {
    const page = resolveCardPage(seedRow());
    render(<CardRenderer data={page.data} theme={page.theme} />);

    expect(screen.getByText(/Dewan Seri Kenangan/)).toBeInTheDocument();
    expect(screen.getByText(/Sabtu, 14 Ogos 2027/)).toBeInTheDocument();
    expect(screen.getByText('Dibuat dengan Naeqah')).toBeInTheDocument();
  });

  it('renders the sections the theme asks for, minus the empty ones', () => {
    const page = resolveCardPage(seedRow());
    const { container } = render(<CardRenderer data={page.data} theme={page.theme} />);

    const rendered = [...container.querySelectorAll('[data-section]')].map((node) =>
      node.getAttribute('data-section'),
    );

    // `galeri` is listed by the theme but the seeded card has no photos.
    expect(rendered).toEqual([
      'pembuka',
      'pengantin',
      'tarikh',
      'lokasi',
      'aturcara',
      'doa',
      'hubungi',
      'rsvp',
      'ucapan',
    ]);
  });
});
