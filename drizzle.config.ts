import { defineConfig } from 'drizzle-kit';

import {
  drizzleKitCommandNeedsDatabase,
  loadEnvFiles,
  requireDatabaseUrl,
} from './lib/env';

/**
 * `drizzle-kit` is its own CLI, not Next.js, so nothing has loaded
 * `.env.local` by the time this file runs — see `lib/env.ts` for the whole
 * story. Load it here, before the config is built.
 */
loadEnvFiles();

/**
 * `db:generate` reads `lib/db/schema.ts` and writes SQL without connecting, so
 * it must keep working with no `DATABASE_URL` at all. `db:push`, `db:studio`,
 * `db:pull` and `db:migrate` do connect, and for those a missing variable is
 * reported here in plain language rather than reaching drizzle-kit as an empty
 * string and coming back as `[x] url: ''`.
 */
const url = drizzleKitCommandNeedsDatabase(process.argv)
  ? requireDatabaseUrl()
  : (process.env.DATABASE_URL ?? '');

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
