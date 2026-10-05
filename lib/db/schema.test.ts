import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getTableConfig, type PgTable } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import {
  attendanceEnum,
  bookingStatusEnum,
  bookings,
  cardStatusEnum,
  cards,
  rsvps,
  templateStatusEnum,
  templates,
  tierEnum,
  users,
  wishes,
} from './schema';

const tables = { users, templates, bookings, cards, rsvps, wishes };

type TableName = keyof typeof tables;

function config(table: PgTable) {
  return getTableConfig(table);
}

function columnNames(table: PgTable): string[] {
  return config(table).columns.map((column) => column.name);
}

function indexByName(table: PgTable, name: string) {
  return config(table).indexes.find((index) => index.config.name === name);
}

describe('schema tables', () => {
  it('declares exactly the six tables from SPEC.md', () => {
    const names = Object.values(tables)
      .map((table) => config(table).name)
      .sort();

    expect(names).toEqual(
      ['bookings', 'cards', 'rsvps', 'templates', 'users', 'wishes'].sort(),
    );
  });

  it.each(Object.keys(tables) as TableName[])(
    '%s has a uuid primary key named id',
    (name) => {
      const table = tables[name];
      const primaryKeyColumns = config(table)
        .columns.filter((column) => column.primary)
        .map((column) => column.name);

      expect(primaryKeyColumns).toEqual(['id']);

      const id = config(table).columns.find((column) => column.name === 'id');
      expect(id?.getSQLType()).toBe('uuid');
      expect(id?.hasDefault).toBe(true);
    },
  );

  it.each(Object.keys(tables) as TableName[])(
    '%s records when a row was created',
    (name) => {
      const createdAt = config(tables[name]).columns.find(
        (column) => column.name === 'created_at',
      );

      expect(createdAt).toBeDefined();
      expect(createdAt?.notNull).toBe(true);
      expect(createdAt?.hasDefault).toBe(true);
      expect(createdAt?.getSQLType()).toBe('timestamp with time zone');
    },
  );

  it.each<TableName>(['users', 'templates', 'bookings', 'cards'])(
    '%s records when a row was last changed',
    (name) => {
      const updatedAt = config(tables[name]).columns.find(
        (column) => column.name === 'updated_at',
      );

      expect(updatedAt?.notNull).toBe(true);
      expect(updatedAt?.hasDefault).toBe(true);
    },
  );
});

describe('cards.slug', () => {
  it('is unique and indexed — it is the public invitation URL', () => {
    const slugIndex = indexByName(cards, 'cards_slug_unique');

    expect(slugIndex).toBeDefined();
    expect(slugIndex?.config.unique).toBe(true);
    expect(
      slugIndex?.config.columns.map((column) => (column as { name: string }).name),
    ).toEqual(['slug']);
  });

  it('is required', () => {
    const slug = config(cards).columns.find((column) => column.name === 'slug');

    expect(slug?.notNull).toBe(true);
    expect(slug?.hasDefault).toBe(false);
  });
});

describe('other unique constraints', () => {
  it('one account per email address', () => {
    expect(indexByName(users, 'users_email_unique')?.config.unique).toBe(true);
  });

  it('one template per slug', () => {
    expect(indexByName(templates, 'templates_slug_unique')?.config.unique).toBe(true);
  });

  it('one card per booking', () => {
    expect(indexByName(cards, 'cards_booking_id_unique')?.config.unique).toBe(true);
  });

  it('one booking per payment gateway reference', () => {
    const index = indexByName(bookings, 'bookings_gateway_ref_unique');

    expect(index?.config.unique).toBe(true);
    // Partial, so unpaid bookings may all leave gateway_ref null.
    expect(index?.config.where).toBeDefined();
  });
});

describe('foreign keys', () => {
  const expected: Array<{
    from: TableName;
    column: string;
    to: TableName;
    onDelete: string;
  }> = [
    { from: 'bookings', column: 'user_id', to: 'users', onDelete: 'restrict' },
    {
      from: 'bookings',
      column: 'template_id',
      to: 'templates',
      onDelete: 'restrict',
    },
    { from: 'cards', column: 'booking_id', to: 'bookings', onDelete: 'cascade' },
    { from: 'rsvps', column: 'card_id', to: 'cards', onDelete: 'cascade' },
    { from: 'wishes', column: 'card_id', to: 'cards', onDelete: 'cascade' },
  ];

  it.each(expected)(
    '$from.$column references $to and is $onDelete on delete',
    ({ from, column, to, onDelete }) => {
      const match = config(tables[from]).foreignKeys.find((fk) => {
        const reference = fk.reference();
        return (
          reference.columns.some((col) => col.name === column) &&
          config(reference.foreignTable).name === config(tables[to]).name
        );
      });

      expect(match).toBeDefined();
      expect(match?.onDelete).toBe(onDelete);
      expect(match?.reference().foreignColumns.map((col) => col.name)).toEqual(['id']);
    },
  );

  it('has no foreign key the list above misses', () => {
    const actual = Object.values(tables).flatMap((table) => config(table).foreignKeys);

    expect(actual).toHaveLength(expected.length);
  });

  it('deleting a card takes its guest data with it (PDPA retention, C7)', () => {
    for (const table of [rsvps, wishes]) {
      const fk = config(table).foreignKeys[0];
      expect(fk?.onDelete).toBe('cascade');
    }
  });

  it('a user with a booking cannot be deleted out from under it', () => {
    const fk = config(bookings).foreignKeys.find((candidate) =>
      candidate.reference().columns.some((col) => col.name === 'user_id'),
    );

    expect(fk?.onDelete).toBe('restrict');
  });
});

describe('enums', () => {
  it('tiers match the SPEC.md pricing table', () => {
    expect(tierEnum.enumValues).toEqual(['asas', 'premium', 'eksklusif']);
  });

  it('templates and cards are either draft or published', () => {
    expect(templateStatusEnum.enumValues).toEqual(['draft', 'published']);
    expect(cardStatusEnum.enumValues).toEqual(['draft', 'published']);
  });

  it('booking status covers the whole payment lifecycle', () => {
    expect(bookingStatusEnum.enumValues).toEqual([
      'pending',
      'paid',
      'failed',
      'refunded',
    ]);
  });

  it('an RSVP is a yes or a no, in Bahasa Malaysia', () => {
    expect(attendanceEnum.enumValues).toEqual(['hadir', 'tidak_hadir']);
  });
});

describe('column shapes that the rest of the app depends on', () => {
  it('money is stored in sen as an integer, never a float', () => {
    const priceSen = config(bookings).columns.find(
      (column) => column.name === 'price_sen',
    );

    expect(priceSen?.getSQLType()).toBe('integer');
    expect(priceSen?.notNull).toBe(true);
  });

  it('card content is jsonb, so adding a field needs no migration', () => {
    const data = config(cards).columns.find((column) => column.name === 'data');

    expect(data?.getSQLType()).toBe('jsonb');
    expect(data?.notNull).toBe(true);
    expect(data?.hasDefault).toBe(true);
  });

  it('cards carry the event date in a queryable column for retention', () => {
    expect(columnNames(cards)).toContain('event_date');
    expect(indexByName(cards, 'cards_event_date_idx')).toBeDefined();
  });

  it('an RSVP keeps the guest name, phone, answer and head count', () => {
    expect(columnNames(rsvps)).toEqual(
      expect.arrayContaining(['card_id', 'name', 'phone', 'attendance', 'guest_count']),
    );
  });

  it('a wish can be hidden by the couple without being deleted', () => {
    const isHidden = config(wishes).columns.find((column) => column.name === 'is_hidden');

    expect(isHidden?.getSQLType()).toBe('boolean');
    expect(isHidden?.notNull).toBe(true);
    expect(isHidden?.hasDefault).toBe(true);
  });
});

describe('generated migration', () => {
  const migrationsDir = join(process.cwd(), 'drizzle');

  const sqlFiles = readdirSync(migrationsDir).filter((file) => file.endsWith('.sql'));

  it('is committed alongside the schema', () => {
    expect(sqlFiles.length).toBeGreaterThan(0);
  });

  it('creates every table and the unique slug index', () => {
    const sql = sqlFiles
      .map((file) => readFileSync(join(migrationsDir, file), 'utf8'))
      .join('\n');

    for (const table of Object.values(tables)) {
      expect(sql).toContain(`CREATE TABLE "${config(table).name}"`);
    }

    expect(sql).toContain('CREATE UNIQUE INDEX "cards_slug_unique"');
  });
});
