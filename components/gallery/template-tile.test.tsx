import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { loadTheme } from '@/lib/themes';
import type { GalleryTemplate } from '@/lib/template-gallery';
import { TemplateTile } from './template-tile';

const TEMPLATE: GalleryTemplate = {
  slug: 'klasik',
  name: 'Klasik',
  tier: 'asas',
  theme: loadTheme('lib/themes/klasik.json'),
};

function tile(template: GalleryTemplate = TEMPLATE) {
  // A tile is an `<li>`; give it the list it expects so the DOM stays valid.
  return render(
    <ul>
      <TemplateTile template={template} />
    </ul>,
  );
}

describe('TemplateTile', () => {
  it('links to the full preview for its own slug', () => {
    tile();

    expect(screen.getByRole('link')).toHaveAttribute('href', '/templates/klasik');
  });

  it('is one tap target, not a card with a separate link in it', () => {
    tile();

    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('names the template and its tier', () => {
    tile();

    expect(screen.getByText('Klasik')).toBeInTheDocument();
    expect(screen.getByText('Asas')).toBeInTheDocument();
  });

  it('uses the tier label, never the raw enum value', () => {
    tile({ ...TEMPLATE, tier: 'eksklusif' });

    expect(screen.getByText('Eksklusif')).toBeInTheDocument();
    expect(screen.queryByText('eksklusif')).not.toBeInTheDocument();
  });

  /** `docs/SPEC.md`: pricing is not final. See `TIER_LABELS`. */
  it('shows no price', () => {
    const { container } = tile();

    expect(container.textContent).not.toMatch(/RM\s*\d/);
  });

  it('contains the theme’s own preview', () => {
    const { container } = tile();

    expect(container.querySelector('[data-template-preview]')).not.toBeNull();
  });

  /**
   * Next would otherwise prefetch the payload of every preview that scrolls
   * into view, and each one is a whole card. The majority of brides are on a
   * phone (CLAUDE.md → "Mobile-first"), so that is real data spent guessing
   * which tile gets tapped.
   */
  it('does not prefetch the preview it links to', () => {
    // Asserted against the source: `prefetch` is Next's own behaviour and
    // leaves no attribute in the DOM either way, so a rendered tile cannot
    // tell us which was asked for.
    const source = readFileSync(
      join(process.cwd(), 'components', 'gallery', 'template-tile.tsx'),
      'utf8',
    );

    expect(source).toContain('prefetch={false}');
  });

  it('tags itself with its slug, so a gallery test can find one tile', () => {
    tile();

    expect(screen.getByRole('link')).toHaveAttribute('data-template-tile', 'klasik');
  });
});
