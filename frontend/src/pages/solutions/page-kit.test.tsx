import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrangeBand, SpecimenGrid, StepRows, UnderTheHood } from './page-kit';

/** Reduced motion: headings and reveals render as plain elements, so the markup is easy to read. */
beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

describe('UnderTheHood', () => {
  it('folds the technical detail away until it is asked for', async () => {
    const user = userEvent.setup();
    render(<UnderTheHood>Edit distance and homoglyph checks.</UnderTheHood>);

    const toggle = screen.getByRole('button', { name: /under the hood/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // Closed: the note is in the DOM for search engines but inert, so it cannot take focus.
    expect(screen.getByText(/edit distance/i).closest('[inert]')).not.toBeNull();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/edit distance/i).closest('[inert]')).toBeNull();
  });
});

describe('StepRows', () => {
  it('is a real ordered list with a heading and a sentence for every step', () => {
    render(
      <StepRows
        steps={[
          { title: 'Watch', text: 'Similo collects new names.', hood: 'Scheduled collectors.' },
          { title: 'Check', text: 'Each name is compared with your brand.' },
        ]}
      />,
    );

    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]!).getByRole('heading', { name: 'Watch' })).toBeInTheDocument();
    expect(within(items[0]!).getByText('Similo collects new names.')).toBeInTheDocument();
    // Only the first step has a technical note.
    expect(within(items[0]!).getByRole('button', { name: /under the hood/i })).toBeInTheDocument();
    expect(within(items[1]!).queryByRole('button')).toBeNull();
  });
});

describe('SpecimenGrid', () => {
  it('numbers its specimens FIG. 01 and up and shows the mono example', () => {
    render(
      <SpecimenGrid
        items={[
          {
            title: 'Lookalike spelling',
            text: 'Letters that are easy to miss.',
            example: 'acrne.com',
          },
          { title: 'Sleeper sites', text: 'Quiet for weeks, then live.' },
        ]}
      />,
    );

    expect(screen.getByText('FIG. 01')).toBeInTheDocument();
    expect(screen.getByText('FIG. 02')).toBeInTheDocument();
    expect(screen.getByText('acrne.com')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });
});

describe('OrangeBand', () => {
  it('has one headline, one sentence and links to where the buttons say', () => {
    render(
      <MemoryRouter>
        <OrangeBand
          title="See the whole workflow in one demo."
          description="We will walk you through each step."
          primary={{ label: 'Request a demo', to: '/contact' }}
          secondary={{ label: 'How the AI works', to: '/technology' }}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: /see the whole workflow/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request a demo/i })).toHaveAttribute(
      'href',
      '/contact',
    );
    expect(screen.getByRole('link', { name: 'How the AI works' })).toHaveAttribute(
      'href',
      '/technology',
    );
  });

  it('leaves out the second button when asked', () => {
    render(
      <MemoryRouter>
        <OrangeBand title="From reading to watching." description="Ask us." secondary={null} />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});
