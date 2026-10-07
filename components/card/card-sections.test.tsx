import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { parseCardData, type CardData, type CardDataInput } from '@/lib/card-schema';
import { sectionIdSchema, parseTheme, type ThemeInput } from '@/lib/theme-schema';
import { sectionRegistry, visibleSections } from './card-sections';
import { placeholderCardData } from './placeholder-card';
import { darkTheme, lightTheme } from './test-themes';

/** The placeholder card with one branch replaced. */
function cardWith(patch: Partial<CardDataInput>): CardData {
  return parseCardData({ ...(placeholderCardData as CardDataInput), ...patch });
}

/** The smallest card the schema accepts: nothing optional filled in. */
const bareCard = parseCardData({
  couple: { groom: { name: 'Lelaki Penuh' }, bride: { name: 'Perempuan Penuh' } },
  event: { date: '2027-05-15', startTime: '11:00' },
  venue: { name: 'Dewan Ujian', addressLines: ['Jalan Ujian 1'] },
});

describe('sectionRegistry', () => {
  it('covers every section id the theme schema allows', () => {
    // Record<SectionId, …> makes this a typecheck too; the runtime assertion is
    // here so a future session sees the failure as a test, not a tsc error.
    expect(Object.keys(sectionRegistry).sort()).toEqual(
      [...sectionIdSchema.options].sort(),
    );
  });
});

describe('visibleSections', () => {
  it('keeps the theme order, not a hard-coded one', () => {
    expect(visibleSections(placeholderCardData, darkTheme)).toEqual([
      'pembuka',
      'tarikh',
      'doa',
      'lokasi',
      'rsvp',
    ]);
  });

  it('drops blocks this couple left empty', () => {
    // The light theme lists all ten; a bare card fills none of the optional ones.
    expect(visibleSections(bareCard, lightTheme)).toEqual([
      'pembuka',
      'pengantin',
      'tarikh',
      'lokasi',
      'rsvp',
      'ucapan',
    ]);
  });

  it('shows aturcara, doa, galeri and hubungi once there is content', () => {
    const filled = parseCardData({
      ...(bareCard as CardDataInput),
      programme: [{ time: '11:00', title: 'Ketibaan' }],
      prayer: { text: 'Doa ringkas.' },
      photos: { gallery: [{ url: '/a.jpg' }] },
      contacts: [{ name: 'Ali', phone: '0123456789' }],
    });

    expect(visibleSections(filled, lightTheme)).toContain('aturcara');
    expect(visibleSections(filled, lightTheme)).toContain('doa');
    expect(visibleSections(filled, lightTheme)).toContain('galeri');
    expect(visibleSections(filled, lightTheme)).toContain('hubungi');
  });

  it('never drops rsvp — a card with no way to reply is the thing being sold', () => {
    for (const theme of [lightTheme, darkTheme]) {
      expect(visibleSections(bareCard, theme)).toContain('rsvp');
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Individual blocks                                                          */
/* -------------------------------------------------------------------------- */

function renderSection(
  id: keyof typeof sectionRegistry,
  data: CardData = placeholderCardData,
  theme = lightTheme,
) {
  const Section = sectionRegistry[id].component;

  return render(<Section data={data} theme={theme} />);
}

describe('pembuka', () => {
  it('prints the short names and the greeting', () => {
    renderSection('pembuka');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Zulkifli & Aisyah',
    );
    expect(screen.getByText(/kami menjemput tuan\/puan/i)).toBeInTheDocument();
  });

  it('puts the hosting side first', () => {
    renderSection(
      'pembuka',
      cardWith({ couple: { ...placeholderCardData.couple, host: 'perempuan' } }),
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Aisyah & Zulkifli',
    );
  });

  it('shows the event title above the names when there is one', () => {
    renderSection('pembuka');
    expect(screen.getByText('Walimatulurus')).toBeInTheDocument();
  });

  it('renders without a cover photo, which the placeholder has none of', () => {
    const { container } = renderSection('pembuka');

    expect(placeholderCardData.photos.cover).toBeUndefined();
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });

  it('uses the cover photo when one exists', () => {
    const withCover = cardWith({
      photos: { cover: { url: '/cover.jpg', alt: 'Pengantin' }, gallery: [] },
    });
    const { container } = renderSection('pembuka', withCover);

    const image = container.querySelector('img');
    expect(image).toHaveAttribute('src', '/cover.jpg');
    expect(image).toHaveAttribute('alt', 'Pengantin');
    // The cover is the first thing a guest sees, so it is not lazy.
    expect(image).toHaveAttribute('loading', 'eager');
  });

  it('composes differently for each cover style in the theme', () => {
    const withCover = cardWith({
      photos: { cover: { url: '/cover.jpg' }, gallery: [] },
    });

    const html = (cover: 'tengah' | 'atas' | 'penuh') => {
      const theme = parseTheme({
        ...(lightTheme as ThemeInput),
        layout: { ...lightTheme.layout, cover },
      });
      const Section = sectionRegistry.pembuka.component;

      return render(<Section data={withCover} theme={theme} />).container.innerHTML;
    };

    const tengah = html('tengah');
    const atas = html('atas');
    const penuh = html('penuh');

    expect(tengah).not.toBe(atas);
    expect(atas).not.toBe(penuh);
    expect(tengah).not.toBe(penuh);
  });

  it('falls back to a composition that works when a photo-led cover has no photo', () => {
    const theme = parseTheme({
      ...(lightTheme as ThemeInput),
      layout: { ...lightTheme.layout, cover: 'penuh' },
    });

    renderSection('pembuka', bareCard, theme);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Lelaki Penuh & Perempuan Penuh',
    );
  });
});

describe('pengantin', () => {
  it('prints full names and both sets of parents', () => {
    renderSection('pengantin');

    expect(screen.getByText('Ahmad Zulkifli bin Hassan')).toBeInTheDocument();
    expect(screen.getByText('Nurul Aisyah binti Razak')).toBeInTheDocument();
    expect(
      screen.getByText('Anak kepada Hassan bin Ibrahim & Mariam binti Sulaiman'),
    ).toBeInTheDocument();
  });

  it('omits the parents line when none were given', () => {
    const { container } = renderSection('pengantin', bareCard);

    expect(container.textContent).not.toContain('Anak kepada');
  });
});

describe('tarikh', () => {
  it('writes the date in Bahasa Malaysia with a machine-readable time element', () => {
    const { container } = renderSection('tarikh');

    expect(screen.getByText('Sabtu, 15 Mei 2027')).toBeInTheDocument();
    expect(container.querySelector('time')).toHaveAttribute('datetime', '2027-05-15');
  });

  it('shows the hijri date the couple typed, never a computed one', () => {
    renderSection('tarikh');
    expect(screen.getByText('8 Zulhijjah 1448')).toBeInTheDocument();
  });

  it('prints a time range when both start and end were given', () => {
    renderSection('tarikh');
    expect(screen.getByText('11.00 pagi – 4.00 petang')).toBeInTheDocument();
  });

  it('prints one time when the couple gave no end time', () => {
    renderSection('tarikh', bareCard);
    expect(screen.getByText('11.00 pagi')).toBeInTheDocument();
  });
});

describe('lokasi', () => {
  it('prints the venue, every address line and the locality', () => {
    renderSection('lokasi');

    expect(screen.getByText('Dewan Serbaguna Taman Melati')).toBeInTheDocument();
    expect(screen.getByText('Jalan Melati 3')).toBeInTheDocument();
    expect(
      screen.getByText('53100 Kuala Lumpur Wilayah Persekutuan'),
    ).toBeInTheDocument();
  });

  it('works from the address alone, with no city, state or postcode', () => {
    const { container } = renderSection('lokasi', bareCard);

    expect(screen.getByText('Jalan Ujian 1')).toBeInTheDocument();
    expect(container.querySelector('address')?.textContent).toBe('Jalan Ujian 1');
  });

  it('leaves the Maps and Waze links to task B7', () => {
    const { container } = renderSection('lokasi');

    expect(container.querySelectorAll('a')).toHaveLength(0);
  });
});

describe('aturcara', () => {
  it('lists every row with its time and note', () => {
    renderSection('aturcara');

    expect(screen.getByText('Ketibaan pengantin')).toBeInTheDocument();
    expect(screen.getByText('Diiringi kompang')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(
      placeholderCardData.programme.length,
    );
  });
});

describe('doa', () => {
  it('renders the prayer as a quotation with its attribution', () => {
    const { container } = renderSection('doa');

    expect(container.querySelector('blockquote')).toHaveTextContent(
      'Ya Allah, berkatilah majlis ini',
    );
    expect(screen.getByText('Doa')).toBeInTheDocument();
  });
});

describe('galeri', () => {
  it('renders one lazy image per gallery photo', () => {
    const withGallery = cardWith({
      photos: { gallery: [{ url: '/1.jpg' }, { url: '/2.jpg' }] },
    });
    const { container } = renderSection('galeri', withGallery);

    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('loading', 'lazy');
  });

  it('gives an image with no alt text an empty alt, not a made-up one', () => {
    const withGallery = cardWith({ photos: { gallery: [{ url: '/1.jpg' }] } });
    const { container } = renderSection('galeri', withGallery);

    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });
});

describe('hubungi', () => {
  it('makes each number tappable without reformatting what was typed', () => {
    renderSection('hubungi');

    const link = screen.getByRole('link', { name: '011-000 0000' });
    expect(link).toHaveAttribute('href', 'tel:0110000000');
    expect(screen.getByText('Bapa pengantin lelaki')).toBeInTheDocument();
  });
});

describe('rsvp', () => {
  it('shows the deadline the couple set', () => {
    renderSection('rsvp');

    expect(screen.getByText('Sila jawab sebelum 1 Mei 2027.')).toBeInTheDocument();
  });

  it('renders with no deadline set', () => {
    renderSection('rsvp', bareCard);

    expect(screen.getByRole('heading')).toHaveTextContent('Kehadiran');
  });

  it('carries no form and no PDPA text yet — those are tasks B8 and C6a', () => {
    const { container } = renderSection('rsvp');

    expect(container.querySelectorAll('form, input, textarea, button')).toHaveLength(0);
    expect(container.textContent).not.toMatch(/pdpa|persetujuan/i);
  });
});

describe('ucapan', () => {
  it('renders its heading as the container task B9 fills', () => {
    renderSection('ucapan');

    expect(screen.getByRole('heading')).toHaveTextContent('Ucapan');
  });
});
