import { describe, expect, it } from 'vitest';
import { parseCardData } from '@/lib/card-schema';
import {
  displayName,
  formatCardDate,
  formatCardDateShort,
  formatCardTime,
  formatTimeRange,
  orderedCouple,
  parentsLine,
  partOfDay,
} from './card-format';
import { placeholderCardData } from './placeholder-card';

describe('formatCardDate', () => {
  it('writes the weekday, day, Bahasa Malaysia month and year', () => {
    expect(formatCardDate('2027-05-15')).toBe('Sabtu, 15 Mei 2027');
  });

  it('gets Sunday right (weekday index 0)', () => {
    expect(formatCardDate('2027-03-14')).toBe('Ahad, 14 Mac 2027');
  });

  it('names every month in Bahasa Malaysia', () => {
    const months = Array.from({ length: 12 }, (_, index) =>
      formatCardDateShort(`2027-${String(index + 1).padStart(2, '0')}-01`),
    );

    expect(months).toEqual([
      '1 Januari 2027',
      '1 Februari 2027',
      '1 Mac 2027',
      '1 April 2027',
      '1 Mei 2027',
      '1 Jun 2027',
      '1 Julai 2027',
      '1 Ogos 2027',
      '1 September 2027',
      '1 Oktober 2027',
      '1 November 2027',
      '1 Disember 2027',
    ]);
  });

  it('does not depend on the machine locale or timezone', () => {
    // The whole reason the month table is hard-coded: a build host without full
    // ICU would make Intl fall back to English and ship a card saying "March".
    expect(formatCardDateShort('2027-03-01')).not.toContain('March');
    // A date rendered at UTC midnight must not slip a day either way.
    expect(formatCardDateShort('2027-01-01')).toBe('1 Januari 2027');
    expect(formatCardDateShort('2027-12-31')).toBe('31 Disember 2027');
  });

  it('drops no leading zero from the day', () => {
    expect(formatCardDateShort('2027-05-07')).toBe('7 Mei 2027');
  });
});

describe('partOfDay', () => {
  it('splits the day the way Malaysians say it', () => {
    expect(partOfDay(0)).toBe('tengah malam');
    expect(partOfDay(1)).toBe('pagi');
    expect(partOfDay(11)).toBe('pagi');
    expect(partOfDay(12)).toBe('tengah hari');
    expect(partOfDay(13)).toBe('petang');
    expect(partOfDay(18)).toBe('petang');
    expect(partOfDay(19)).toBe('malam');
    expect(partOfDay(23)).toBe('malam');
  });
});

describe('formatCardTime', () => {
  it('uses a dot, not a colon', () => {
    expect(formatCardTime('14:30')).toBe('2.30 petang');
  });

  it('keeps both minute digits', () => {
    expect(formatCardTime('11:00')).toBe('11.00 pagi');
    expect(formatCardTime('09:05')).toBe('9.05 pagi');
  });

  it('calls 12 noon and midnight 12, not 0', () => {
    expect(formatCardTime('12:00')).toBe('12.00 tengah hari');
    expect(formatCardTime('00:15')).toBe('12.15 tengah malam');
  });
});

describe('formatTimeRange', () => {
  it('writes a single time when the couple gave no end time', () => {
    expect(formatTimeRange('11:00')).toBe('11.00 pagi');
  });

  it('joins start and end with an en dash', () => {
    expect(formatTimeRange('11:00', '16:00')).toBe('11.00 pagi – 4.00 petang');
  });
});

describe('displayName', () => {
  it('prefers the short name for the cover', () => {
    expect(displayName(placeholderCardData.couple.groom)).toBe('Zulkifli');
  });

  it('falls back to the full name when no short name was given', () => {
    expect(displayName({ name: 'Siti Khadijah binti Omar' })).toBe(
      'Siti Khadijah binti Omar',
    );
  });
});

describe('parentsLine', () => {
  it('joins both parents with an ampersand', () => {
    expect(parentsLine(placeholderCardData.couple.bride)).toBe(
      'Razak bin Yusof & Halimah binti Daud',
    );
  });

  it('prints one name alone rather than a stray ampersand', () => {
    expect(parentsLine({ name: 'A', parents: { father: 'Bapa' } })).toBe('Bapa');
    expect(parentsLine({ name: 'A', parents: { mother: 'Ibu' } })).toBe('Ibu');
  });

  it('returns undefined when no parents are named, so the line is omitted', () => {
    expect(parentsLine({ name: 'A' })).toBeUndefined();
    expect(parentsLine({ name: 'A', parents: {} })).toBeUndefined();
  });
});

describe('orderedCouple', () => {
  const base = {
    event: placeholderCardData.event,
    venue: placeholderCardData.venue,
  };

  function coupleWithHost(host: 'lelaki' | 'perempuan' | 'bersama') {
    return parseCardData({
      ...base,
      couple: { host, groom: { name: 'Lelaki' }, bride: { name: 'Perempuan' } },
    }).couple;
  }

  it('names the groom first when his side hosts', () => {
    expect(orderedCouple(coupleWithHost('lelaki')).map((p) => p.name)).toEqual([
      'Lelaki',
      'Perempuan',
    ]);
  });

  it('names the bride first when her side hosts', () => {
    expect(orderedCouple(coupleWithHost('perempuan')).map((p) => p.name)).toEqual([
      'Perempuan',
      'Lelaki',
    ]);
  });

  it('falls back to groom first when both families host together', () => {
    expect(orderedCouple(coupleWithHost('bersama')).map((p) => p.name)).toEqual([
      'Lelaki',
      'Perempuan',
    ]);
  });
});
