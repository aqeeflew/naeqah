import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  ENV_FILES,
  drizzleKitCommandNeedsDatabase,
  loadEnvFile,
  loadEnvFiles,
  requireDatabaseUrl,
  requireEnv,
} from './env';

/* -------------------------------------------------------------------------- */
/* Pure helpers                                                               */
/* -------------------------------------------------------------------------- */

describe('ENV_FILES', () => {
  /**
   * `process.loadEnvFile` never overwrites a variable that is already set, so
   * the order of this list *is* the precedence rule. `.env.local` before
   * `.env`, and the real process environment ahead of both.
   */
  it('puts the developer file ahead of the shared fallback', () => {
    expect([...ENV_FILES]).toEqual(['.env.local', '.env']);
  });
});

describe('drizzleKitCommandNeedsDatabase', () => {
  it('is true for the commands that open a connection', () => {
    for (const command of ['push', 'pull', 'studio', 'migrate']) {
      expect(
        drizzleKitCommandNeedsDatabase(['node', 'drizzle-kit', command]),
        `${command} connects`,
      ).toBe(true);
    }
  });

  /**
   * The acceptance criterion that `db:generate` keeps working without a
   * database (`docs/BACKLOG.md` → A2) lives or dies on this one.
   */
  it('is false for generate, however it is invoked', () => {
    expect(drizzleKitCommandNeedsDatabase(['node', 'drizzle-kit', 'generate'])).toBe(
      false,
    );
    expect(
      drizzleKitCommandNeedsDatabase([
        'node',
        'drizzle-kit',
        'generate',
        '--name=add_wishes',
      ]),
    ).toBe(false);
  });

  it('is false for the other offline commands', () => {
    for (const command of ['check', 'up', 'export', '--help', '--version']) {
      expect(
        drizzleKitCommandNeedsDatabase(['node', 'drizzle-kit', command]),
        `${command} does not connect`,
      ).toBe(false);
    }
  });

  /** Fails open: an argv it does not recognise must not break the command. */
  it('is false for an empty or unrecognised argv', () => {
    expect(drizzleKitCommandNeedsDatabase([])).toBe(false);
    expect(drizzleKitCommandNeedsDatabase(['node', 'drizzle-kit'])).toBe(false);
    expect(drizzleKitCommandNeedsDatabase(['node', 'drizzle-kit', 'teleport'])).toBe(
      false,
    );
  });

  it('matches whole arguments, not substrings', () => {
    expect(drizzleKitCommandNeedsDatabase(['node', 'drizzle-kit', 'pushover'])).toBe(
      false,
    );
    expect(drizzleKitCommandNeedsDatabase(['node', 'drizzle-kit', '--no-push'])).toBe(
      false,
    );
  });
});

describe('requireEnv', () => {
  it('returns the value when it is set', () => {
    expect(requireEnv('ANY_NAME', { ANY_NAME: 'value' })).toBe('value');
  });

  it('throws a message naming the variable, the files and the fix', () => {
    let message = '';
    try {
      requireEnv('DATABASE_URL', {});
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain('DATABASE_URL is not set');
    expect(message).toContain('.env.local');
    expect(message).toContain('.env.example');
  });

  /**
   * `DATABASE_URL=` in a half-filled `.env.local` is the exact shape of the
   * original bug: an empty string that drizzle-kit reported as `url: ''`.
   * Treat it as missing.
   */
  it('treats an empty or whitespace value as missing', () => {
    expect(() => requireEnv('DATABASE_URL', { DATABASE_URL: '' })).toThrow(/is not set/);
    expect(() => requireEnv('DATABASE_URL', { DATABASE_URL: '   ' })).toThrow(
      /is not set/,
    );
  });

  it('does not trim a real value', () => {
    expect(requireEnv('X', { X: ' postgres://a/b ' })).toBe(' postgres://a/b ');
  });
});

describe('requireDatabaseUrl', () => {
  it('reads DATABASE_URL', () => {
    expect(requireDatabaseUrl({ DATABASE_URL: 'postgres://u:p@h/db' })).toBe(
      'postgres://u:p@h/db',
    );
  });

  it('names DATABASE_URL when it is missing', () => {
    expect(() => requireDatabaseUrl({})).toThrow(/^DATABASE_URL is not set/);
  });
});

/* -------------------------------------------------------------------------- */
/* Actually loading a file                                                    */
/* -------------------------------------------------------------------------- */

/**
 * These tests write real files and let `process.loadEnvFile` mutate the real
 * `process.env` — that mutation is the whole behaviour task A2c is about, so
 * stubbing it would test nothing. Every key touched is restored afterwards.
 */
describe('loadEnvFile', () => {
  const TOUCHED = ['A2C_URL', 'A2C_OTHER', 'A2C_FROM_FALLBACK', 'A2C_QUOTED'] as const;

  let dir: string;
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'naeqah-env-'));
    saved = Object.fromEntries(TOUCHED.map((key) => [key, process.env[key]]));
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(dir, { recursive: true, force: true });
  });

  it('loads the variables in a file into process.env', () => {
    writeFileSync(
      join(dir, '.env.local'),
      '# a comment\nA2C_URL=postgres://u:p@host/db\nA2C_OTHER=two\n',
    );

    expect(loadEnvFile('.env.local', dir)).toBe(true);
    expect(process.env.A2C_URL).toBe('postgres://u:p@host/db');
    expect(process.env.A2C_OTHER).toBe('two');
  });

  /** A hash inside a quoted password must survive. Node's parser handles it. */
  it('keeps a quoted value intact', () => {
    writeFileSync(join(dir, '.env.local'), 'A2C_QUOTED="pa#ss word"\n');

    loadEnvFile('.env.local', dir);

    expect(process.env.A2C_QUOTED).toBe('pa#ss word');
  });

  /**
   * Vercel and CI set real environment variables; a file on a laptop must not
   * win over them.
   */
  it('leaves a variable that is already set alone', () => {
    process.env.A2C_URL = 'from-the-real-environment';
    writeFileSync(join(dir, '.env.local'), 'A2C_URL=from-the-file\n');

    loadEnvFile('.env.local', dir);

    expect(process.env.A2C_URL).toBe('from-the-real-environment');
  });

  /** No `.env.local` is the normal state in CI, not a failure. */
  it('returns false for a file that is not there, without throwing', () => {
    expect(loadEnvFile('.env.local', dir)).toBe(false);
  });

  it('resolves the path against the given directory, not the process cwd', () => {
    writeFileSync(join(dir, '.env.local'), 'A2C_URL=from-temp-dir\n');

    loadEnvFile('.env.local', dir);

    expect(process.env.A2C_URL).toBe('from-temp-dir');
  });
});

describe('loadEnvFiles', () => {
  const TOUCHED = ['A2C_URL', 'A2C_FROM_FALLBACK'] as const;

  let dir: string;
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'naeqah-env-'));
    saved = Object.fromEntries(TOUCHED.map((key) => [key, process.env[key]]));
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(dir, { recursive: true, force: true });
  });

  it('reports only the files that existed', () => {
    writeFileSync(join(dir, '.env.local'), 'A2C_URL=local\n');

    expect(loadEnvFiles(ENV_FILES, dir)).toEqual(['.env.local']);
  });

  it('returns an empty list when there is nothing to load', () => {
    expect(loadEnvFiles(ENV_FILES, dir)).toEqual([]);
  });

  /** `.env.local` is read first, so it wins; `.env` only fills the gaps. */
  it('gives .env.local precedence and lets .env fill the rest', () => {
    writeFileSync(join(dir, '.env.local'), 'A2C_URL=from-local\n');
    writeFileSync(join(dir, '.env'), 'A2C_URL=from-shared\nA2C_FROM_FALLBACK=yes\n');

    expect(loadEnvFiles(ENV_FILES, dir)).toEqual(['.env.local', '.env']);
    expect(process.env.A2C_URL).toBe('from-local');
    expect(process.env.A2C_FROM_FALLBACK).toBe('yes');
  });
});
