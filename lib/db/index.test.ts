import { afterEach, describe, expect, it } from 'vitest';

import { getDb, requireDatabaseUrl } from './index';

const original = process.env.DATABASE_URL;

afterEach(() => {
  if (original === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = original;
  }
});

describe('requireDatabaseUrl', () => {
  it('returns the connection string when it is set', () => {
    process.env.DATABASE_URL = 'postgres://user:pw@example.test/naeqah';

    expect(requireDatabaseUrl()).toBe('postgres://user:pw@example.test/naeqah');
  });

  it('explains what to do when it is missing', () => {
    delete process.env.DATABASE_URL;

    expect(() => requireDatabaseUrl()).toThrow(/DATABASE_URL is not set/);
    expect(() => requireDatabaseUrl()).toThrow(/\.env\.example/);
  });
});

describe('getDb', () => {
  it('does not connect at import time — only when first called', () => {
    delete process.env.DATABASE_URL;

    // Importing this module above did not throw; building without a database
    // must stay possible. The error surfaces here instead.
    expect(() => getDb()).toThrow(/DATABASE_URL is not set/);
  });
});
