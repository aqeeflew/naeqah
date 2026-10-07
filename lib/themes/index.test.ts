import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { sectionIdSchema, themeSchema } from '@/lib/theme-schema';
import { findTheme, loadTheme, themeFiles, themeRegistry } from './index';

const THEME_DIR = join(process.cwd(), 'lib', 'themes');

function jsonFilesOnDisk(): string[] {
  return readdirSync(THEME_DIR).filter((name) => name.endsWith('.json'));
}

describe('themeRegistry', () => {
  it('is not empty — the catalogue needs at least one template', () => {
    expect(themeFiles.length).toBeGreaterThan(0);
  });

  it('holds a fully parsed theme for every registered file', () => {
    for (const file of themeFiles) {
      expect(themeSchema.safeParse(themeRegistry[file]).success).toBe(true);
    }
  });

  /**
   * The one way this design can rot: a designer drops `moden.json` into this
   * directory, nobody adds the import, and the template is invisible with no
   * error anywhere. A bundler cannot discover an import from a database
   * string, so this test is what makes the manual step safe.
   */
  it('registers every .json file in lib/themes/', () => {
    const expected = jsonFilesOnDisk()
      .map((name) => `lib/themes/${name}`)
      .sort();

    expect([...themeFiles].sort()).toEqual(expected);
  });

  it('keys themes exactly as templates.theme_file stores them', () => {
    for (const file of themeFiles) {
      expect(file).toMatch(/^lib\/themes\/[a-z0-9-]+\.json$/);
    }
  });
});

describe('loadTheme', () => {
  it('returns the theme for a known file', () => {
    expect(loadTheme('lib/themes/klasik.json').name).toBe('Klasik');
  });

  it.each([
    './lib/themes/klasik.json',
    '/lib/themes/klasik.json',
    'klasik.json',
    'lib/themes/tiada.json',
  ])('throws for %s, naming what is available', (file) => {
    expect(() => loadTheme(file)).toThrow(/Known themes: lib\/themes\//);
  });

  it('findTheme returns undefined instead of throwing', () => {
    expect(findTheme('lib/themes/tiada.json')).toBeUndefined();
  });
});

describe('klasik', () => {
  const klasik = loadTheme('lib/themes/klasik.json');

  it('is the functional base theme: simple layout, no assets to license', () => {
    expect(klasik.background.kind).toBe('warna');
    expect(klasik.ornament).toBeUndefined();
  });

  /**
   * A system font stack makes zero network requests, which is the point: the
   * card has to open on wedding-morning mobile data even if fonts.googleapis
   * is unreachable. Real typography arrives with the designed themes (A5b).
   */
  it('loads no webfont', () => {
    for (const font of [klasik.fonts.heading, klasik.fonts.body, klasik.fonts.display]) {
      expect(font?.googleFont).toBeUndefined();
    }
  });

  it('lists every section the schema knows, so no card content is dropped', () => {
    const all = sectionIdSchema.options;

    expect([...klasik.layout.sections].sort()).toEqual([...all].sort());
  });

  it('shows the branding line (asas tier is the growth channel)', () => {
    expect(klasik.showBranding).toBe(true);
  });

  it('is the file on disk, not a copy that can drift', () => {
    const onDisk = JSON.parse(
      readFileSync(join(THEME_DIR, 'klasik.json'), 'utf8'),
    ) as unknown;

    expect(themeSchema.parse(onDisk)).toEqual(klasik);
  });
});
