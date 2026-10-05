import { describe, expect, it } from 'vitest';

import {
  cardDataSchema,
  cardSchema,
  coordinatesSchema,
  imageSchema,
  isCardData,
  isoDateSchema,
  parseCardData,
  programmeItemSchema,
  safeParseCardData,
  timeOfDaySchema,
  venueSchema,
  type CardDataInput,
} from './card-schema';

/** The smallest card that validates: every required field, nothing else. */
function minimalCard(): CardDataInput {
  return {
    couple: {
      groom: { name: 'Muhammad Aqeef bin Rahman' },
      bride: { name: 'Nurul Huda binti Ismail' },
    },
    event: { date: '2027-03-14', startTime: '11:00' },
    venue: {
      name: 'Dewan Seri Melati',
      addressLines: ['Jalan Dato Keramat 12'],
    },
  };
}

/** A card with every optional branch filled in. */
function fullCard(): CardDataInput {
  return {
    couple: {
      groom: {
        name: 'Muhammad Aqeef bin Rahman',
        shortName: 'Aqeef',
        parents: { father: 'Rahman bin Yusof', mother: 'Siti Aminah binti Daud' },
      },
      bride: {
        name: 'Nurul Huda binti Ismail',
        shortName: 'Nurul',
        parents: { father: 'Ismail bin Hashim', mother: 'Zaiton binti Omar' },
      },
      host: 'perempuan',
    },
    event: {
      date: '2027-03-14',
      hijriDate: '5 Syawal 1448',
      startTime: '11:00',
      endTime: '16:00',
      title: 'Walimatulurus',
    },
    venue: {
      name: 'Dewan Seri Melati',
      addressLines: ['Jalan Dato Keramat 12', 'Taman Melati'],
      city: 'Kuala Lumpur',
      state: 'Wilayah Persekutuan',
      postcode: '53100',
      coordinates: { lat: 3.2102, lng: 101.7215 },
    },
    greeting: 'Dengan penuh kesyukuran kepada Allah SWT',
    programme: [
      { time: '11:00', title: 'Ketibaan tetamu' },
      { time: '12:30', title: 'Ketibaan pengantin', note: 'Diiringi kompang' },
      { time: '15:00', title: 'Majlis bersurai' },
    ],
    prayer: {
      text: 'Ya Allah, berkatilah pernikahan ini dan himpunkanlah kami dalam kebaikan.',
      source: 'Doa walimah',
    },
    photos: {
      cover: { url: '/uploads/cover.jpg', alt: 'Pasangan pengantin' },
      gallery: [{ url: 'https://cdn.example.com/prewed-1.jpg' }],
    },
    contacts: [
      {
        name: 'Ismail bin Hashim',
        phone: '012-345 6789',
        role: 'Bapa pengantin perempuan',
      },
      { name: 'Zaiton binti Omar', phone: '+60193334444' },
    ],
    rsvpDeadline: '2027-03-01',
  };
}

describe('isoDateSchema', () => {
  it.each(['2027-03-14', '2028-02-29'])('accepts %s', (value) => {
    expect(isoDateSchema.parse(value)).toBe(value);
  });

  it.each(['14-03-2027', '2027-3-14', '2027/03/14', '2027-13-01', '2027-02-31', ''])(
    'rejects %s',
    (value) => {
      expect(isoDateSchema.safeParse(value).success).toBe(false);
    },
  );
});

describe('timeOfDaySchema', () => {
  it.each(['00:00', '11:00', '23:59'])('accepts %s', (value) => {
    expect(timeOfDaySchema.parse(value)).toBe(value);
  });

  it.each(['24:00', '11:60', '1:00', '11.00', '11:00:00', '11am'])(
    'rejects %s',
    (value) => {
      expect(timeOfDaySchema.safeParse(value).success).toBe(false);
    },
  );
});

describe('imageSchema', () => {
  it.each(['/uploads/a.jpg', 'https://cdn.example.com/a.jpg', 'http://x.test/a.png'])(
    'accepts %s',
    (url) => {
      expect(imageSchema.parse({ url }).url).toBe(url);
    },
  );

  it.each(['uploads/a.jpg', 'javascript:alert(1)', 'data:image/png;base64,AAA', ''])(
    'rejects %s',
    (url) => {
      expect(imageSchema.safeParse({ url }).success).toBe(false);
    },
  );

  it('rejects unknown keys', () => {
    expect(imageSchema.safeParse({ url: '/a.jpg', width: 400 }).success).toBe(false);
  });
});

describe('coordinatesSchema', () => {
  it('accepts a point in Malaysia', () => {
    expect(coordinatesSchema.parse({ lat: 3.139, lng: 101.6869 })).toEqual({
      lat: 3.139,
      lng: 101.6869,
    });
  });

  it.each([
    { lat: 91, lng: 0 },
    { lat: -91, lng: 0 },
    { lat: 0, lng: 181 },
    { lat: 0, lng: -181 },
  ])('rejects out-of-range %j', (value) => {
    expect(coordinatesSchema.safeParse(value).success).toBe(false);
  });

  it('rejects coordinates given as strings', () => {
    expect(coordinatesSchema.safeParse({ lat: '3.139', lng: '101.6869' }).success).toBe(
      false,
    );
  });
});

describe('venueSchema', () => {
  it('requires at least one address line', () => {
    const result = venueSchema.safeParse({ name: 'Dewan Seri Melati', addressLines: [] });
    expect(result.success).toBe(false);
  });

  it('works without coordinates, so task B7 must fall back to the address', () => {
    const venue = venueSchema.parse({
      name: 'Dewan Seri Melati',
      addressLines: ['Jalan Dato Keramat 12'],
    });
    expect(venue.coordinates).toBeUndefined();
  });

  it.each(['5310', '531000', 'AB123'])('rejects postcode %s', (postcode) => {
    expect(
      venueSchema.safeParse({
        name: 'Dewan Seri Melati',
        addressLines: ['Jalan Dato Keramat 12'],
        postcode,
      }).success,
    ).toBe(false);
  });
});

describe('programmeItemSchema', () => {
  it('requires a time and a title', () => {
    expect(programmeItemSchema.safeParse({ time: '11:00' }).success).toBe(false);
    expect(programmeItemSchema.safeParse({ title: 'Ketibaan tetamu' }).success).toBe(
      false,
    );
  });
});

describe('cardDataSchema — valid input', () => {
  it('accepts the minimal card', () => {
    expect(() => parseCardData(minimalCard())).not.toThrow();
  });

  it('accepts a card with every optional field filled in', () => {
    expect(() => parseCardData(fullCard())).not.toThrow();
  });

  it('fills in defaults for the collection fields', () => {
    const card = parseCardData(minimalCard());

    expect(card.couple.host).toBe('bersama');
    expect(card.programme).toEqual([]);
    expect(card.contacts).toEqual([]);
    expect(card.photos).toEqual({ gallery: [] });
  });

  it('preserves what the couple typed instead of normalising it', () => {
    const card = parseCardData(fullCard());

    expect(card.contacts[0]?.phone).toBe('012-345 6789');
    expect(card.event.hijriDate).toBe('5 Syawal 1448');
  });

  it('trims surrounding whitespace from names', () => {
    const input = minimalCard();
    input.couple.groom.name = '  Muhammad Aqeef bin Rahman  ';

    expect(parseCardData(input).couple.groom.name).toBe('Muhammad Aqeef bin Rahman');
  });

  it('is recognised by the isCardData guard', () => {
    expect(isCardData(fullCard())).toBe(true);
    expect(isCardData({})).toBe(false);
    expect(isCardData(null)).toBe(false);
  });
});

describe('cardDataSchema — rejected input', () => {
  it('rejects an empty object and names every missing branch', () => {
    const result = safeParseCardData({});

    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((issue) => issue.path.join('.')) ?? [];
    expect(paths).toContain('couple');
    expect(paths).toContain('event');
    expect(paths).toContain('venue');
  });

  it.each([null, undefined, 42, 'kad', []])('rejects %j', (input) => {
    expect(safeParseCardData(input).success).toBe(false);
  });

  it('rejects a blank bride name', () => {
    const input = minimalCard();
    input.couple.bride.name = '   ';

    const result = safeParseCardData(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['couple', 'bride', 'name']);
  });

  it('rejects a missing groom', () => {
    const input = minimalCard() as Record<string, unknown>;
    input.couple = { bride: { name: 'Nurul Huda binti Ismail' } };

    expect(safeParseCardData(input).success).toBe(false);
  });

  it('rejects unknown top-level keys rather than silently dropping them', () => {
    const input = { ...minimalCard(), muzikLatar: '/audio/nasyid.mp3' };

    const result = safeParseCardData(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.code).toBe('unrecognized_keys');
  });

  it('rejects an unknown host value', () => {
    const input = minimalCard() as Record<string, unknown>;
    input.couple = {
      groom: { name: 'Aqeef' },
      bride: { name: 'Nurul' },
      host: 'kedua-dua',
    };

    expect(safeParseCardData(input).success).toBe(false);
  });

  it('rejects an end time before the start time', () => {
    const input = minimalCard();
    input.event.endTime = '09:00';

    const result = safeParseCardData(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['event', 'endTime']);
  });

  it('rejects an end time equal to the start time', () => {
    const input = minimalCard();
    input.event.endTime = input.event.startTime;

    expect(safeParseCardData(input).success).toBe(false);
  });

  it('allows two programme rows at the same time', () => {
    const input = minimalCard();
    input.programme = [
      { time: '11:00', title: 'Ketibaan tetamu' },
      { time: '11:00', title: 'Hidangan dibuka' },
    ];

    expect(safeParseCardData(input).success).toBe(true);
  });

  it('rejects an RSVP deadline after the ceremony', () => {
    const input = minimalCard();
    input.rsvpDeadline = '2027-03-20';

    const result = safeParseCardData(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['rsvpDeadline']);
  });

  it('accepts an RSVP deadline on the day of the ceremony', () => {
    const input = minimalCard();
    input.rsvpDeadline = '2027-03-14';

    expect(safeParseCardData(input).success).toBe(true);
  });

  it('rejects a programme that is out of time order', () => {
    const input = minimalCard();
    input.programme = [
      { time: '15:00', title: 'Majlis bersurai' },
      { time: '11:00', title: 'Ketibaan tetamu' },
    ];

    const result = safeParseCardData(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['programme']);
  });

  it('rejects a gallery larger than twelve photos', () => {
    const input = minimalCard();
    input.photos = {
      gallery: Array.from({ length: 13 }, (_, i) => ({ url: `/uploads/${i}.jpg` })),
    };

    expect(safeParseCardData(input).success).toBe(false);
  });

  it.each(['abc', '0123456', '+60 12-345 6789 ext'])(
    'rejects contact phone %s',
    (phone) => {
      const input = minimalCard();
      input.contacts = [{ name: 'Ismail bin Hashim', phone }];

      const expected = /^[0-9+][0-9\s()+-]*$/.test(phone) && phone.length >= 7;
      expect(safeParseCardData(input).success).toBe(expected);
    },
  );

  it('reports errors in Bahasa Malaysia, because the editor shows them verbatim', () => {
    const input = minimalCard();
    input.event.startTime = '11am';

    const result = safeParseCardData(input);
    expect(result.error?.issues[0]?.message).toBe(
      'Masa mesti dalam bentuk HH:MM (24 jam).',
    );
  });
});

describe('cardDataSchema — presentation stays out', () => {
  it.each(['palette', 'fonts', 'layout', 'background', 'theme', 'slug', 'status'])(
    'rejects the presentation key %s',
    (key) => {
      const input = { ...minimalCard(), [key]: 'apa-apa' };

      expect(safeParseCardData(input).success).toBe(false);
    },
  );

  it('round-trips through JSON, since it is stored in cards.data as jsonb', () => {
    const card = parseCardData(fullCard());

    expect(parseCardData(JSON.parse(JSON.stringify(card)))).toEqual(card);
  });
});

describe('cardSchema composition', () => {
  it('carries no cross-field checks on its own', () => {
    // The two exports exist so the editor can compose partial forms. Only
    // `cardDataSchema` enforces the rules that span branches.
    const input = minimalCard();
    input.rsvpDeadline = '2027-03-20';

    expect(cardSchema.safeParse(input).success).toBe(true);
    expect(cardDataSchema.safeParse(input).success).toBe(false);
  });

  it('can be made partial for the editor autosave in task A7', () => {
    // `cardSchema`, not `cardDataSchema`: Zod refuses `.partial()` on an
    // object carrying refinements, which is why the cross-field checks live
    // on a separate export.
    const draft = cardSchema.partial();

    expect(draft.safeParse({}).success).toBe(true);
    expect(
      draft.safeParse({ event: { date: '2027-03-14', startTime: '11:00' } }).success,
    ).toBe(true);
    expect(draft.safeParse({ event: { date: 'esok' } }).success).toBe(false);
  });
});
