/**
 * Database client.
 *
 * Nothing on the guest path imports this: `/kad/[slug]` is generated at
 * publish time and served statically (SPEC.md → architecture decision 1).
 * Only the couple's dashboard, the editor and the RSVP POST handler need it.
 *
 * The connection is created on first use so that `next build` — and every
 * unit test — works without `DATABASE_URL` set.
 *
 * `next` loads `.env.local` on its own, so nothing here has to. A plain-node
 * script that imports this module does not get that for free and must call
 * `loadEnvFiles()` from `lib/env.ts` first (see that file for why).
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import { requireDatabaseUrl } from '../env';
import * as schema from './schema';

export * from './schema';
export { schema };

export type Database = ReturnType<typeof createDb>;

function createDb(connectionString: string) {
  return drizzle(neon(connectionString), { schema });
}

/**
 * Re-exported so callers of this module keep one import. The message lives in
 * `lib/env.ts` so the app and `drizzle.config.ts` cannot drift into telling a
 * developer two different things about the same missing variable.
 */
export { requireDatabaseUrl };

let cached: Database | undefined;

/** The shared client. Call this instead of constructing your own. */
export function getDb(): Database {
  cached ??= createDb(requireDatabaseUrl());
  return cached;
}
