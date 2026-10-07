/**
 * Environment loading for the tools that run *outside* Next.js.
 *
 * ## Why this file exists
 *
 * Next.js reads `.env.local` by itself. Every `next` command — `next dev`,
 * `next build` — loads it into `process.env` before any application code
 * runs, so nothing in `app/` or `lib/` ever has to think about it.
 *
 * `drizzle-kit` is a separate CLI. It is not Next.js and it does not share
 * that behaviour: it starts, loads `drizzle.config.ts`, and whatever is in
 * `process.env` at that moment is all it will ever see. With no loader in
 * place, `DATABASE_URL` is simply absent there even when `.env.local`
 * contains a perfectly good one — which is how `npm run db:push` came to fail
 * with `[x] url: ''` (task A2c).
 *
 * So `drizzle.config.ts` calls `loadEnvFiles()` before it builds its config.
 * Any other plain-node script that touches the database — `db:seed` in task
 * A5, the retention job in C7 — must do the same, for exactly the same
 * reason.
 *
 * ## Why there is no dotenv dependency
 *
 * `process.loadEnvFile()` is built into Node (18.20+/20.12+/21.7+; this repo
 * runs 22). It is the same parser behind `node --env-file`, and it has the
 * precedence we want: **a variable already present in `process.env` is left
 * alone**, so a real environment variable set by Vercel or CI always beats a
 * stale file on a laptop. Shipping `dotenv` to re-implement that would be one
 * more dependency for no behaviour we need.
 *
 * `--env-file` itself is not an option here: Node rejects it inside
 * `NODE_OPTIONS`, and `drizzle-kit` is launched as a bin, not as `node`.
 */
import { resolve } from 'node:path';

/**
 * Searched in order, highest precedence first. `.env.local` is the developer's
 * own file and is git-ignored; `.env` is the shared, committed-by-convention
 * fallback that this repo does not currently use. Because
 * `process.loadEnvFile` never overwrites a variable that is already set,
 * loading them in this order gives: real environment → `.env.local` → `.env`.
 */
export const ENV_FILES = ['.env.local', '.env'] as const;

/**
 * `drizzle-kit` commands that open a connection, and therefore genuinely need
 * `DATABASE_URL`.
 *
 * `generate` is deliberately absent: it reads `lib/db/schema.ts` and writes
 * SQL, and must keep working on a machine that has never seen a database
 * (`docs/BACKLOG.md` → A2 "Siap bila"). `check` and `up` only read the files
 * in `drizzle/`.
 */
const CONNECTING_COMMANDS = ['push', 'pull', 'studio', 'migrate'] as const;

/**
 * Does this `drizzle-kit` invocation need a database?
 *
 * Read from the CLI's own argv, because `drizzle.config.ts` is loaded inside
 * the `drizzle-kit` process and has no other way to know which subcommand is
 * running. It **fails open**: an argv this does not recognise is treated as
 * not needing a database, so a future `drizzle-kit` command can never be
 * broken by this check — the worst case is drizzle-kit printing its own error
 * instead of ours.
 */
export function drizzleKitCommandNeedsDatabase(argv: readonly string[]): boolean {
  return argv.some((arg) => (CONNECTING_COMMANDS as readonly string[]).includes(arg));
}

/**
 * Load one env file into `process.env`, if it is there.
 *
 * Returns `true` when the file was found and applied, `false` when it does not
 * exist — a missing `.env.local` is the normal state in CI, not an error. Any
 * other failure (an unreadable file, a syntax error) is rethrown, because
 * silently ignoring a file the developer *did* write is how this class of bug
 * survives.
 */
export function loadEnvFile(file: string, cwd: string = process.cwd()): boolean {
  try {
    process.loadEnvFile(resolve(cwd, file));

    return true;
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

/**
 * Load every env file this repo uses, and return the ones that existed.
 *
 * Paths resolve against `cwd`, which defaults to the process working
 * directory — npm scripts always run at the package root, which is where the
 * files live.
 */
export function loadEnvFiles(
  files: readonly string[] = ENV_FILES,
  cwd: string = process.cwd(),
): string[] {
  return files.filter((file) => loadEnvFile(file, cwd));
}

/**
 * The one definition of "this variable is set".
 *
 * Stated once so `hasEnv` and `requireEnv` cannot drift: `DATABASE_URL=` in a
 * half-filled `.env.local` is a mistake, not a deliberate empty value, and
 * letting it through is what produced the original `[x] url: ''`.
 */
function isUsableValue(value: string | undefined): value is string {
  return value !== undefined && value.trim() !== '';
}

/**
 * Is a variable set to something usable?
 *
 * `requireEnv` throws on exactly what this returns `false` for. This exists
 * for the callers that must *branch* instead of throwing — the chief one being
 * `generateStaticParams` in `app/kad/[slug]/`, which has to leave `next build`
 * green on a machine that has never had a database.
 */
export function hasEnv(
  name: string,
  env: Record<string, string | undefined> = process.env,
): boolean {
  return isUsableValue(env[name]);
}

/**
 * Read a variable that the caller cannot run without, or throw an error that
 * says what to do about it.
 *
 * An empty string counts as missing — see `isUsableValue` above.
 */
export function requireEnv(
  name: string,
  env: Record<string, string | undefined> = process.env,
): string {
  const value = env[name];

  if (!isUsableValue(value)) {
    throw new Error(
      `${name} is not set.\n` +
        `Searched: ${ENV_FILES.join(', ')} (relative to the project root), ` +
        `then the process environment.\n` +
        `Fix: copy .env.example to .env.local and fill in ${name}.`,
    );
  }

  return value;
}

/** The Postgres connection string, or a readable error. */
export function requireDatabaseUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  return requireEnv('DATABASE_URL', env);
}
