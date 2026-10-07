import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { placeholderCardData } from '@/components/card';
import { darkTheme, lightTheme } from '@/components/card/test-themes';
import { loadTheme } from '@/lib/themes';
import { TemplatePreview } from './template-preview';

const KLASIK = loadTheme('lib/themes/klasik.json');

function preview(theme = KLASIK): HTMLElement {
  const { container } = render(<TemplatePreview theme={theme} />);
  const node = container.querySelector('[data-template-preview]');

  if (node === null) throw new Error('preview did not render');

  return node as HTMLElement;
}

/* -------------------------------------------------------------------------- */
/* Placeholder data, not a real couple                                        */
/* -------------------------------------------------------------------------- */

describe('TemplatePreview shows placeholder data', () => {
  it('names the fictional couple from placeholderCardData', () => {
    render(<TemplatePreview theme={KLASIK} />);

    expect(screen.getByText('Zulkifli & Aisyah')).toBeInTheDocument();
  });

  it('prints that fixture’s date, not today’s', () => {
    render(<TemplatePreview theme={KLASIK} />);

    expect(placeholderCardData.event.date).toBe('2027-05-15');
    expect(screen.getByText('15 Mei 2027')).toBeInTheDocument();
  });

  /**
   * The gallery is browsed before anyone has bought anything, so there is no
   * couple yet — and the seeded example card is a *different* fixture that
   * belongs to `/kad/[slug]`. Showing its names here would be showing one
   * customer's card as the shop window.
   */
  it('shows nothing from the seeded example card', () => {
    const { container } = render(<TemplatePreview theme={KLASIK} />);

    // Not "Nurul": both fixtures have a Nurul.
    expect(container.textContent).not.toMatch(/Aqeef|Dewan Seri Kenangan/);
  });
});

/* -------------------------------------------------------------------------- */
/* The theme is the only thing that varies                                    */
/* -------------------------------------------------------------------------- */

describe('TemplatePreview is driven entirely by the theme', () => {
  /** The same criterion A4 holds the card renderer to, one level down. */
  it('renders the same data differently under two themes', () => {
    const light = preview(lightTheme).outerHTML;
    const dark = preview(darkTheme).outerHTML;

    expect(light).not.toBe(dark);
  });

  it('takes its colours and fonts from the theme, not from Tailwind', () => {
    const style = preview().getAttribute('style') ?? '';

    expect(style).toContain('--card-primary');
    expect(style).toContain('--card-font-display');
    expect(style).toContain(KLASIK.palette.primary);
  });

  it('inherits the theme’s divider width, so a rule-less theme draws no rule', () => {
    const hairline = preview(darkTheme).querySelector('span');

    // `darkTheme` uses `ornamen`, which is 0px — see DIVIDER_WIDTH.
    expect(hairline?.getAttribute('style')).toContain('var(--card-divider-width)');
  });

  it('has no per-template code in it', () => {
    const source = readFileSync(
      join(process.cwd(), 'components', 'gallery', 'template-preview.tsx'),
      'utf8',
    ).replace(/\/\*[\s\S]*?\*\//g, '');

    expect(source).not.toMatch(/if\s*\(\s*\w*[Tt]emplate\w*\s*===/);
    expect(source).not.toMatch(/theme\.name\s*===/);
    expect(source).not.toContain('klasik');
  });
});

/* -------------------------------------------------------------------------- */
/* Accessibility                                                              */
/* -------------------------------------------------------------------------- */

describe('TemplatePreview is decorative', () => {
  /**
   * The tile already carries the template's real name and tier as text. A
   * screen reader working down the gallery should hear those, not a list of
   * invented couples.
   */
  it('is hidden from assistive technology', () => {
    expect(preview()).toHaveAttribute('aria-hidden', 'true');
  });
});
