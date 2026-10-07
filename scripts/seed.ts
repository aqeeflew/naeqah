/**
 * `npm run db:seed` — put one template and one example card in the database.
 *
 * Run it against a development branch, never against production data: it
 * writes rows it owns (identified by `SEED_TEMPLATE.slug`, `SEED_USER_EMAIL`
 * and `SEED_CARD_SLUG`) and leaves everything else alone, but a seed is still
 * a write.
 *
 * ## Two things this file has to do that a Next.js file does not
 *
 *  1. **Load the env itself.** `next dev`/`next build` read `.env.local`;
 *     plain node does not. `loadEnvFiles()` is the repo's answer to that and
 *     the reason task A2c exists — see `lib/env.ts`.
 *  2. **Be idempotent.** It will be run again, on a database that already has
 *     these rows, and it must not produce a second copy or crash. Every write
 *     below is an upsert keyed on a unique index that already exists in the
 *     schema, so re-running updates in place.
 *
 * The data itself is in `lib/seed-data.ts` so it can be unit tested without a
 * database. This file is only the I/O.
 */
import { eq } from 'drizzle-orm';

import { bookings, cards, getDb, templates, users } from '@/lib/db';
import { loadEnvFiles } from '@/lib/env';
import {
  SEED_BOOKING_PRICE_SEN,
  SEED_CARD_EVENT_DATE,
  SEED_CARD_SLUG,
  SEED_TEMPLATE,
  SEED_USER_EMAIL,
  SEED_USER_NAME,
  seedCardData,
} from '@/lib/seed-data';
import { themeFiles } from '@/lib/themes';

async function seed(): Promise<void> {
  loadEnvFiles();

  // Fail before opening a connection if the fixture points at a theme that is
  // not in the catalogue — a seeded card whose template has no theme would
  // break `next build`, which is a much more confusing place to find out.
  if (!themeFiles.includes(SEED_TEMPLATE.themeFile)) {
    throw new Error(
      `Seed template points at "${SEED_TEMPLATE.themeFile}", which is not a ` +
        `registered theme. Known themes: ${themeFiles.join(', ')}.`,
    );
  }

  const db = getDb();

  /* Template — keyed on `templates_slug_unique`. */
  const [template] = await db
    .insert(templates)
    .values(SEED_TEMPLATE)
    .onConflictDoUpdate({
      target: templates.slug,
      set: {
        name: SEED_TEMPLATE.name,
        tier: SEED_TEMPLATE.tier,
        themeFile: SEED_TEMPLATE.themeFile,
        status: SEED_TEMPLATE.status,
        sortOrder: SEED_TEMPLATE.sortOrder,
        updatedAt: new Date(),
      },
    })
    .returning({ id: templates.id });

  /* Example account — keyed on `users_email_unique`. */
  const [user] = await db
    .insert(users)
    .values({ email: SEED_USER_EMAIL, name: SEED_USER_NAME })
    .onConflictDoUpdate({
      target: users.email,
      set: { name: SEED_USER_NAME, updatedAt: new Date() },
    })
    .returning({ id: users.id });

  if (template === undefined || user === undefined) {
    throw new Error('Seed could not upsert the template or the example user.');
  }

  /*
   * Booking. There is no unique key to upsert on here — `bookings` is a ledger
   * of real orders and giving it one for the seed's benefit would be the wrong
   * tail wagging the wrong dog. So look for the card's existing booking first
   * and reuse it; `cards_booking_id_unique` means each card has exactly one.
   */
  const [existingCard] = await db
    .select({ bookingId: cards.bookingId })
    .from(cards)
    .where(eq(cards.slug, SEED_CARD_SLUG))
    .limit(1);

  let bookingId = existingCard?.bookingId;

  if (bookingId === undefined) {
    const [booking] = await db
      .insert(bookings)
      .values({
        userId: user.id,
        templateId: template.id,
        tier: SEED_TEMPLATE.tier,
        priceSen: SEED_BOOKING_PRICE_SEN,
        // `paid` so the card is reachable the way a real published card is,
        // without a payment gateway in the loop. `paid_at` stays null: no
        // payment happened, and inventing a timestamp for one would be a
        // made-up fact in a column task C1 and C3 will report on.
        status: 'paid',
      })
      .returning({ id: bookings.id });

    if (booking === undefined) throw new Error('Seed could not create the booking.');
    bookingId = booking.id;
  }

  /* Card — keyed on `cards_slug_unique`. */
  await db
    .insert(cards)
    .values({
      bookingId,
      slug: SEED_CARD_SLUG,
      data: seedCardData,
      status: 'published',
      eventDate: SEED_CARD_EVENT_DATE,
      publishedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: cards.slug,
      set: {
        data: seedCardData,
        status: 'published',
        eventDate: SEED_CARD_EVENT_DATE,
        updatedAt: new Date(),
      },
    });

  console.log(
    `Seeded template "${SEED_TEMPLATE.slug}" and card "/kad/${SEED_CARD_SLUG}".\n` +
      `Run \`npm run build\` to prerender the card page.`,
  );
}

seed().catch((error: unknown) => {
  if (!(error instanceof Error)) {
    console.error(error);
    process.exit(1);
  }

  console.error(error.message);

  // Drizzle wraps the driver's failure in `cause`. Printing the message alone
  // gives "Failed query: insert into …" and never says *why* — the same
  // pointing-the-wrong-way error that task A2c existed to fix.
  if (error.cause !== undefined) console.error('Cause:', error.cause);

  process.exit(1);
});
