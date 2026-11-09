import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HoverReveal, HoverRevealItem } from './HoverReveal';
import { HorizontalScroll } from './HorizontalScroll';
import { Marquee } from './Marquee';
import { plainText } from './plain-text';
import { SplitReveal } from './SplitReveal';

/** matchMedia that answers per query: `reduce` for reduced motion, `fine` for a mouse. */
function stubMedia({ reduce = false, fine = false, wide = false } = {}) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches:
        (query.includes('reduce') && reduce) ||
        (query.includes('pointer: fine') && fine) ||
        (query.includes('min-width') && wide),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

/** jsdom has no IntersectionObserver; the headings only split when one exists. */
function stubObserver() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SplitReveal', () => {
  it('shows the plain heading when the browser cannot observe scrolling', () => {
    stubMedia();
    const { container } = render(<SplitReveal as="h2">No observer here</SplitReveal>);
    expect(screen.getByRole('heading', { name: 'No observer here' })).toBeInTheDocument();
    expect(container.querySelectorAll('span')).toHaveLength(0);
  });

  it('keeps the heading as real text, in order, with its emphasis element', () => {
    stubMedia();
    stubObserver();
    const { container } = render(
      <SplitReveal as="h2">
        Find the copycats <em>first.</em>
      </SplitReveal>,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Find the copycats first.' }),
    ).toBeInTheDocument();
    expect(container.querySelector('em')).toHaveTextContent('first.');
    // One mask per word: Find, the, copycats, first.
    expect(container.querySelectorAll('h2 span.inline-block > span.inline-block')).toHaveLength(4);
  });

  it('gives letter mode a single readable copy and hides the split letters', () => {
    stubMedia();
    stubObserver();
    const { container } = render(
      <SplitReveal as="p" by="letters">
        Hi you
      </SplitReveal>,
    );
    expect(container.querySelector('.sr-only')).toHaveTextContent('Hi you');
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('does not split or move anything with reduced motion', () => {
    stubMedia({ reduce: true });
    const { container } = render(<SplitReveal as="h2">Plain heading</SplitReveal>);
    expect(screen.getByRole('heading', { name: 'Plain heading' })).toBeInTheDocument();
    expect(container.querySelectorAll('span')).toHaveLength(0);
  });

  it('passes id and class through', () => {
    stubMedia();
    stubObserver();
    render(
      <SplitReveal as="h3" id="x" className="big">
        Hello
      </SplitReveal>,
    );
    expect(screen.getByRole('heading', { level: 3 })).toHaveAttribute('id', 'x');
    expect(screen.getByRole('heading', { level: 3 })).toHaveClass('big');
  });

  it('reads the plain text of a node tree', () => {
    expect(plainText(['a ', <em key="e">b</em>, ' c'])).toBe('a b c');
  });
});

describe('Marquee', () => {
  it('says its words once to assistive tech and hides the moving copies', () => {
    stubMedia();
    const { container } = render(
      <Marquee label="Websites and apps.">
        <span>websites</span>
        <span>apps</span>
      </Marquee>,
    );
    expect(screen.getByText('Websites and apps.')).toHaveClass('sr-only');
    const track = container.querySelector('[aria-hidden="true"]');
    expect(track).toBeInTheDocument();
    // Repeated enough times for a seamless loop (at least two copies).
    expect(container.querySelectorAll('[aria-hidden="true"] > div').length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it('is one static, wrapping copy with reduced motion', () => {
    stubMedia({ reduce: true });
    const { container } = render(
      <Marquee label="Websites and apps.">
        <span>websites</span>
      </Marquee>,
    );
    expect(container.querySelectorAll('span:not(.sr-only)')).toHaveLength(1);
    expect(container.querySelector('.flex-wrap')).toBeInTheDocument();
  });
});

describe('HorizontalScroll', () => {
  const panels = [
    { id: 'a', label: 'One', children: <h3>First module</h3> },
    { id: 'b', label: 'Two', children: <h3>Second module</h3> },
  ];
  const intro = <h2 id="modules-title">Modules</h2>;

  it('stacks the panels in reading order when the screen is small', () => {
    stubMedia({ wide: false });
    render(<HorizontalScroll intro={intro} panels={panels} labelledBy="modules-title" />);
    expect(screen.getByRole('region', { name: 'Modules' })).toBeInTheDocument();
    const headings = screen.getAllByRole('heading').map((heading) => heading.textContent);
    expect(headings).toEqual(['Modules', 'First module', 'Second module']);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('stacks the panels with reduced motion, even on a wide screen', () => {
    stubMedia({ wide: true, reduce: true });
    const { container } = render(
      <HorizontalScroll intro={intro} panels={panels} labelledBy="modules-title" />,
    );
    expect(container.querySelector('[data-hpanel]')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('keeps every panel in the DOM, in order, when pinned', () => {
    stubMedia({ wide: true });
    const { container } = render(
      <HorizontalScroll intro={intro} panels={panels} labelledBy="modules-title" />,
    );
    // The intro comes first, then one panel per module.
    expect(container.querySelectorAll('[data-hpanel]')).toHaveLength(3);
    const headings = screen.getAllByRole('heading').map((heading) => heading.textContent);
    expect(headings).toEqual(['Modules', 'First module', 'Second module']);
  });
});

describe('HoverReveal', () => {
  function list() {
    return render(
      <HoverReveal>
        <ul>
          <HoverRevealItem id="one" src="/images/one-800.webp">
            <a href="#one">First guide</a>
          </HoverRevealItem>
          <HoverRevealItem id="two" src="/images/two-800.webp">
            <a href="#two">Second guide</a>
          </HoverRevealItem>
        </ul>
      </HoverReveal>,
    );
  }

  it('shows the hovered row’s picture for a mouse, and hides it again', async () => {
    stubMedia({ fine: true });
    const user = userEvent.setup();
    list();
    expect(document.body.querySelector('img')).toBeNull();
    await user.hover(screen.getByText('First guide'));
    await waitFor(() =>
      expect(document.body.querySelector('img')).toHaveAttribute('src', '/images/one-800.webp'),
    );
    // The picture is decoration: empty alt, hidden from assistive tech.
    expect(document.body.querySelector('img')).toHaveAttribute('alt', '');
    expect(document.body.querySelector('img')?.closest('[aria-hidden="true"]')).not.toBeNull();
    await user.unhover(screen.getByText('First guide'));
    await waitFor(() => expect(document.body.querySelector('img')).toBeNull());
  });

  it('does nothing on touch screens (no fine pointer)', async () => {
    stubMedia({ fine: false });
    const user = userEvent.setup();
    list();
    await user.hover(screen.getByText('First guide'));
    expect(document.body.querySelector('img')).toBeNull();
    // The links are still ordinary, focusable links.
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });
});
