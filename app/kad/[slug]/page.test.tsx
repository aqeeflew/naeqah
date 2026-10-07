import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateStaticParams } from './page';

const SOURCE = readFileSync(
  join(process.cwd(), 'app', 'kad', '[slug]', 'page.tsx'),
  'utf8',
);

/** Comments here explain the rules below, so scans must not read them. */
function code(): string {
  return SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(
    /\{\s*\/\*[\s\S]*?\*\/\s*\}/g,
    '',
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/* -------------------------------------------------------------------------- */
/* The acceptance criterion: this page is static                              */
/* -------------------------------------------------------------------------- */

describe('/kad/[slug] is generated, never rendered per request', () => {
  it('prerenders its slugs', () => {
    expect(code()).toMatch(/export async function generateStaticParams/);
  });

  /**
   * Without this, a slug missing from the build falls back to a server render
   * that queries Postgres on a guest request — which is exactly the failure
   * mode the static requirement exists to prevent (CLAUDE.md → "Halaman kad
   * mesti statik").
   */
  it('turns off dynamic params', () => {
    expect(code()).toMatch(/export const dynamicParams = false/);
  });

  it.each(['force-dynamic', 'no-store', 'revalidate = 0'])(
    'does not opt into %s',
    (optOut) => {
      expect(code()).not.toContain(optOut);
    },
  );

  it('is a server component — no client boundary, no hooks, no handlers', () => {
    expect(code()).not.toMatch(/['"]use client['"]/);
    expect(code()).not.toMatch(/\buse[A-Z]\w*\(/);
    expect(code()).not.toMatch(/\son[A-Z]\w*=/);
  });
});

/* -------------------------------------------------------------------------- */
/* Build stays green with no database                                         */
/* -------------------------------------------------------------------------- */

describe('generateStaticParams without DATABASE_URL', () => {
  it('yields no pages instead of failing the build', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(generateStaticParams()).resolves.toEqual([]);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('says so loudly, because on a real deployment it means no card opens', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await generateStaticParams();

    expect(warn.mock.calls[0]?.[0]).toMatch(/DATABASE_URL is not set/);
  });
});
