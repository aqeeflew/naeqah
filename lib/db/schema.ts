/**
 * Database schema (Drizzle ORM / Postgres).
 *
 * Shape follows `docs/SPEC.md` → "Model data". Money is stored in sen
 * (integer) — never floats. Guest-facing card content lives in `cards.data`
 * as JSON validated by `lib/card-schema.ts` (task A3), so adding a field to
 * a card never needs a migration.
 */
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/* -------------------------------------------------------------------------- */
/* Enums                                                                      */
/* -------------------------------------------------------------------------- */

/** Pricing tiers from SPEC.md. Prices themselves are not stored here. */
export const tierEnum = pgEnum('tier', ['asas', 'premium', 'eksklusif']);

/** A template is only offered to couples once `published`. */
export const templateStatusEnum = pgEnum('template_status', ['draft', 'published']);

/**
 * Booking lifecycle. Status only ever moves forward (enforced in the payment
 * webhook, task B5 — not by the database).
 */
export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
]);

/** A card is `published` once its static page has been generated (task B6). */
export const cardStatusEnum = pgEnum('card_status', ['draft', 'published']);

/** RSVP answer. Guests may only pick one of the two. */
export const attendanceEnum = pgEnum('attendance', ['hadir', 'tidak_hadir']);

/* -------------------------------------------------------------------------- */
/* Shared column helpers                                                      */
/* -------------------------------------------------------------------------- */

const createdAt = timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

const updatedAt = timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

/* -------------------------------------------------------------------------- */
/* users                                                                      */
/* -------------------------------------------------------------------------- */

/** Couples who signed up. Auth is magic-link only (task B1) — no passwords. */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Stored lower-cased by the application; uniqueness is case-sensitive. */
    email: text('email').notNull(),
    name: text('name'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex('users_email_unique').on(table.email)],
);

/* -------------------------------------------------------------------------- */
/* templates                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * A template is a configuration record, not a React component. `themeFile`
 * points at `lib/themes/<slug>.json`, which the single renderer in
 * `components/card/` reads. See CLAUDE.md → "Enjin template".
 */
export const templates = pgTable(
  'templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    tier: tierEnum('tier').notNull(),
    /** Path of the theme JSON, relative to the repo root. */
    themeFile: text('theme_file').notNull(),
    status: templateStatusEnum('status').notNull().default('draft'),
    /** Lower sorts first in the gallery (task A6). */
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex('templates_slug_unique').on(table.slug),
    index('templates_status_idx').on(table.status),
  ],
);

/* -------------------------------------------------------------------------- */
/* bookings                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * One paid order. Created `pending` when a couple picks a template (task B2)
 * and moved to `paid` by the ToyyibPay webhook (task B5).
 */
export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    templateId: uuid('template_id')
      .notNull()
      .references(() => templates.id, { onDelete: 'restrict' }),
    /** Copied from the template at purchase time — templates may be retiered. */
    tier: tierEnum('tier').notNull(),
    /** Amount charged, in sen. RM35.00 is stored as 3500. */
    priceSen: integer('price_sen').notNull(),
    status: bookingStatusEnum('status').notNull().default('pending'),
    /** Payment gateway reference (ToyyibPay bill code). Unique when present. */
    gatewayRef: text('gateway_ref'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex('bookings_gateway_ref_unique')
      .on(table.gatewayRef)
      .where(sql`${table.gatewayRef} is not null`),
    index('bookings_user_id_idx').on(table.userId),
    index('bookings_template_id_idx').on(table.templateId),
    index('bookings_status_idx').on(table.status),
  ],
);

/* -------------------------------------------------------------------------- */
/* cards                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The invitation itself. `slug` is what guests receive over WhatsApp, so it is
 * unique and indexed — but `/kad/[slug]` is generated at publish time and
 * served statically, so this table is not queried on a guest request.
 */
export const cards = pgTable(
  'cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** One card per booking. */
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    /** Event details, shaped by `lib/card-schema.ts` (task A3). */
    data: jsonb('data').notNull().default({}),
    status: cardStatusEnum('status').notNull().default('draft'),
    /**
     * Denormalised copy of the ceremony date from `data`, so retention
     * (task C7) and expiry can be queried in SQL.
     */
    eventDate: date('event_date'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    /** When the card stops being served. Set from the tier at publish time. */
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex('cards_slug_unique').on(table.slug),
    uniqueIndex('cards_booking_id_unique').on(table.bookingId),
    index('cards_status_idx').on(table.status),
    index('cards_event_date_idx').on(table.eventDate),
  ],
);

/* -------------------------------------------------------------------------- */
/* rsvps                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Guest replies. Collected without an account. Holds personal data under the
 * PDPA — deleted six months after the ceremony by the retention job (task C7).
 */
export const rsvps = pgTable(
  'rsvps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cardId: uuid('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** Malaysian mobile number as typed by the guest. */
    phone: text('phone').notNull(),
    attendance: attendanceEnum('attendance').notNull(),
    /** Head count including the guest. 0 when not attending. */
    guestCount: smallint('guest_count').notNull().default(1),
    note: text('note'),
    createdAt,
  },
  (table) => [
    index('rsvps_card_id_idx').on(table.cardId),
    index('rsvps_card_id_attendance_idx').on(table.cardId, table.attendance),
  ],
);

/* -------------------------------------------------------------------------- */
/* wishes                                                                     */
/* -------------------------------------------------------------------------- */

/** Guest messages shown under the RSVP form. Couples may hide one. */
export const wishes = pgTable(
  'wishes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cardId: uuid('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    message: text('message').notNull(),
    /** Moderation flag. Hidden wishes stay in the table. */
    isHidden: boolean('is_hidden').notNull().default(false),
    createdAt,
  },
  (table) => [index('wishes_card_id_idx').on(table.cardId)],
);

/* -------------------------------------------------------------------------- */
/* Relations                                                                  */
/* -------------------------------------------------------------------------- */

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const templatesRelations = relations(templates, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  template: one(templates, {
    fields: [bookings.templateId],
    references: [templates.id],
  }),
  card: one(cards),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  booking: one(bookings, {
    fields: [cards.bookingId],
    references: [bookings.id],
  }),
  rsvps: many(rsvps),
  wishes: many(wishes),
}));

export const rsvpsRelations = relations(rsvps, ({ one }) => ({
  card: one(cards, { fields: [rsvps.cardId], references: [cards.id] }),
}));

export const wishesRelations = relations(wishes, ({ one }) => ({
  card: one(cards, { fields: [wishes.cardId], references: [cards.id] }),
}));

/* -------------------------------------------------------------------------- */
/* Inferred types                                                             */
/* -------------------------------------------------------------------------- */

export type Tier = (typeof tierEnum.enumValues)[number];
export type TemplateStatus = (typeof templateStatusEnum.enumValues)[number];
export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];
export type CardStatus = (typeof cardStatusEnum.enumValues)[number];
export type Attendance = (typeof attendanceEnum.enumValues)[number];

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type Rsvp = typeof rsvps.$inferSelect;
export type NewRsvp = typeof rsvps.$inferInsert;
export type Wish = typeof wishes.$inferSelect;
export type NewWish = typeof wishes.$inferInsert;
