import { describe, expect, it } from 'vitest';

import { placeholderCardData } from '@/components/card';
import { cardDataSchema } from '@/lib/card-schema';
import { themeFiles } from '@/lib/themes';
import {
  SEED_BOOKING_PRICE_SEN,
  SEED_CARD_EVENT_DATE,
  SEED_CARD_SLUG,
  SEED_TEMPLATE,
  SEED_USER_EMAIL,
  seedCardData,
} from './seed-data';

describe('SEED_TEMPLATE', () => {
  it('points at a registered theme', () => {
    expect(themeFiles).toContain(SEED_TEMPLATE.themeFile);
  });

  it('is published, so the gallery (A6) has something to list', () => {
    expect(SEED_TEMPLATE.status).toBe('published');
  });

  it('is the asas tier', () => {
    expect(SEED_TEMPLATE.tier).toBe('asas');
  });
});

describe('seedCardData', () => {
  it('satisfies cardDataSchema', () => {
    expect(cardDataSchema.safeParse(seedCardData).success).toBe(true);
  });

  it('is published under the slug the backlog names', () => {
    expect(SEED_CARD_SLUG).toBe('contoh-aqeef-nurul');
  });

  /**
   * `cards.event_date` is a denormalised copy used by the retention job (C7).
   * A column that disagreed with the JSON would leave a card rendering while
   * being invisible to retention, so it is derived, never typed twice.
   */
  it('derives the event_date column from the card data', () => {
    expect(SEED_CARD_EVENT_DATE).toBe(seedCardData.event.date);
  });

  it('fills every optional block, so the seeded card exercises the renderer', () => {
    expect(seedCardData.greeting).toBeDefined();
    expect(seedCardData.prayer).toBeDefined();
    expect(seedCardData.programme.length).toBeGreaterThan(0);
    expect(seedCardData.contacts.length).toBeGreaterThan(0);
    expect(seedCardData.rsvpDeadline).toBeDefined();
  });

  /** Licensed assets arrive with A5b; until then an image reference is a 404. */
  it('carries no photos', () => {
    expect(seedCardData.photos.cover).toBeUndefined();
    expect(seedCardData.photos.gallery).toEqual([]);
  });

  /**
   * The seeded row and the gallery's stand-in must stay distinguishable. If
   * both showed the same couple, a page wired to the wrong source would look
   * correct.
   */
  it('names a different couple than placeholderCardData', () => {
    expect(seedCardData.couple.groom.name).not.toBe(
      placeholderCardData.couple.groom.name,
    );
    expect(seedCardData.couple.bride.name).not.toBe(
      placeholderCardData.couple.bride.name,
    );
  });
});

/**
 * CLAUDE.md → "Jangan reka nilai sebenar" and "jangan commit rahsia". A seed
 * is committed source, so nothing in it may be a real price or a real way to
 * reach a real person.
 */
describe('the fixture invents nothing real', () => {
  it('charges zero sen, because no price has been decided', () => {
    expect(SEED_BOOKING_PRICE_SEN).toBe(0);
  });

  it('uses a reserved TLD for the example account', () => {
    expect(SEED_USER_EMAIL).toMatch(/@[a-z0-9.-]+\.(test|example|invalid|localhost)$/);
  });

  it('gives every contact an all-zero subscriber number', () => {
    for (const contact of seedCardData.contacts) {
      expect(contact.phone.replace(/\D/g, '')).toMatch(/^0\d{2}0{7,}$/);
    }
  });
});
