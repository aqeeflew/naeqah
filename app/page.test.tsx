import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from './page';

describe('HomePage', () => {
  it('renders the product name as the page heading', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Naeqah');
  });

  it('renders the Bahasa Malaysia tagline', () => {
    render(<HomePage />);
    expect(screen.getByText(/satu pautan, satu majlis/i)).toBeInTheDocument();
  });
});
