/**
 * Database client.
 *
 * Nothing on the guest path imports this: `/kad/[slug]` is generated at
 * publish time and served statically (SPEC.md → architecture decision 1).
 * Only the couple's dashboard, the editor and the RSVP POST handler need it.
 *
 * The connection is created on first use so that `next build` — and every
 * unit test — works without `DATABASE_URL` set.
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

export * from './schema';
export { schema };

export type Database = ReturnType<typeof createDb>;

function createDb(connectionString: string) {
  return drizzle(neon(connectionString), { schema });
}

/** Throws a readable error instead of a driver stack trace. */
export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.',
    );
  }
  return url;
}

let cached: Database | undefined;

/** The shared client. Call this instead of constructing your own. */
export function getDb(): Database {
  cached ??= createDb(requireDatabaseUrl());
  return cached;
}
