/**
 * The theme catalogue: every `lib/themes/<slug>.json` file, parsed once.
 *
 * `templates.theme_file` (`lib/db/schema.ts`) holds a path like
 * `lib/themes/klasik.json`, and something has to turn that string into a
 * `Theme` the renderer can take. This module is that something, and it does it
 * with **static imports rather than `fs`**, for two reasons:
 *
 *  1. `/kad/[slug]` is prerendered and must never touch the filesystem on a
 *     guest request (SPEC.md → architecture decision 1). A static import is
 *     resolved by the bundler and inlined; `readFileSync` would make the page
 *     depend on the repo being on disk next to the running function.
 *  2. A theme file that no longer satisfies `themeSchema` fails the **build**,
 *     not a card on the morning of a wedding. Parsing happens at module load,
 *     so there is no valid-looking theme waiting to throw later.
 *
 * Adding a template is still "add one JSON file" (CLAUDE.md → "Enjin
 * template") plus one line in `THEME_SOURCES` below — a bundler cannot
 * discover imports from a database string, and a dynamic `import()` would
 * reintroduce a runtime read. There is a test that fails when a `.json` file
 * in this directory is missing from that map, so the line cannot be forgotten.
 */
import { parseTheme, type Theme } from '@/lib/theme-schema';

import klasik from './klasik.json';

/**
 * Theme file path → the raw JSON, keyed exactly as `templates.theme_file`
 * stores it: repo-root-relative, no leading `./`.
 */
const THEME_SOURCES: Readonly<Record<string, unknown>> = {
  'lib/themes/klasik.json': klasik,
};

/**
 * Every theme, parsed and defaulted. Built eagerly so an invalid file is a
 * module-load error.
 */
export const themeRegistry: Readonly<Record<string, Theme>> = Object.freeze(
  Object.fromEntries(
    Object.entries(THEME_SOURCES).map(([file, source]) => [file, parseTheme(source)]),
  ),
);

/** The `theme_file` values a `templates` row may legally hold. */
export const themeFiles: readonly string[] = Object.freeze(Object.keys(themeRegistry));

/** The theme for a `templates.theme_file` value, or `undefined`. */
export function findTheme(themeFile: string): Theme | undefined {
  return themeRegistry[themeFile];
}

/**
 * The theme for a `templates.theme_file` value, or an error that names what is
 * actually available.
 *
 * Deliberately strict about the key: one canonical spelling means a `templates`
 * row can be checked against `themeFiles` (the admin panel in task C3 should
 * offer that list rather than a free-text field), and a typo surfaces here with
 * the valid options instead of rendering a card with the wrong look.
 */
export function loadTheme(themeFile: string): Theme {
  const theme = findTheme(themeFile);

  if (theme === undefined) {
    throw new Error(
      `Unknown theme file "${themeFile}".\n` +
        `Known themes: ${themeFiles.join(', ')}.\n` +
        `Fix: add the file to lib/themes/ and register it in THEME_SOURCES ` +
        `(lib/themes/index.ts), or correct templates.theme_file.`,
    );
  }

  return theme;
}
