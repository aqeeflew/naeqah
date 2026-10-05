import { defineConfig } from 'drizzle-kit';

/**
 * `db:generate` only reads the schema file — it does not connect, so it runs
 * without DATABASE_URL. `db:push` does connect, and fails with a readable
 * error when the variable is missing.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  strict: true,
  verbose: true,
});
