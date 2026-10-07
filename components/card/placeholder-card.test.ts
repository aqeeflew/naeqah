/**
 * Guards on the one fixture that task A6 makes **public**.
 *
 * `placeholderCardData` used to be seen only by the renderer's own tests.
 * `/templates` and `/templates/[slug]` put it on the open web, so the rules
 * `lib/seed-data.ts` applies to the seeded card now apply here too — and they
 * need a test of their own, because the next session to edit this fixture will
 * be thinking about how the gallery looks, not about who picks up the phone.
 */
import { describe, expect, it } from 'vitest';

import { parseCardData, type CardDataInput } from '@/lib/card-schema';
import { placeholderCardData } from './placeholder-card';

describe('placeholderCardData invents nothing reachable', () => {
  /**
   * CLAUDE.md → "Jangan reka nilai sebenar". `hubungi` renders every contact
   * as a `tel:` link, so a plausible mobile number on a public preview page is
   * a stranger's phone ringing. Same shape as the seeded card: an operator
   * prefix, then zeros.
   */
  it('gives every contact an all-zero subscriber part', () => {
    expect(placeholderCardData.contacts.length).toBeGreaterThan(0);

    for (const contact of placeholderCardData.contacts) {
      expect(contact.phone.replace(/\D/g, '')).toMatch(/^0\d{2}0{7,}$/);
    }
  });

  /**
   * A venue is the other field a reader could act on. It has to be somewhere
   * nobody will turn up to, so the name is a generic `Dewan …` rather than a
   * hall that exists and takes bookings.
   */
  it('names no real venue or postcode outside the fiction', () => {
    expect(placeholderCardData.venue.name).toMatch(/^Dewan /);
    expect(placeholderCardData.venue.postcode).toMatch(/^\d{5}$/);
  });

  it('stays a valid card, so the preview page cannot ship a broken one', () => {
    expect(() => parseCardData(placeholderCardData as CardDataInput)).not.toThrow();
  });

  /**
   * The two fixtures must stay distinguishable: this one is the shop window,
   * `lib/seed-data.ts` is one example customer's card. A test elsewhere would
   * silently pass if they were the same people.
   */
  it('is a dated, obviously fictional event', () => {
    expect(placeholderCardData.event.date).toBe('2027-05-15');
    expect(placeholderCardData.couple.groom.shortName).toBe('Zulkifli');
  });
});
