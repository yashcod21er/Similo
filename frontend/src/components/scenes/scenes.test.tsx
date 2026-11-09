import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  ACME_DIFFERENCES,
  AcmeSheet,
  CompareSlider,
  IsometricStack,
  LetterSwap,
  Loupe,
  NumberRoll,
  StampSlam,
} from '.';

function stubMotionPreference(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduce && query.includes('reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

describe('CompareSlider', () => {
  function setup() {
    stubMotionPreference(true);
    render(
      <CompareSlider
        original={<p>original page</p>}
        copy={<p>copy page</p>}
        notes={ACME_DIFFERENCES}
        caption="Sample pages of a fictional brand"
      />,
    );
    return screen.getByRole('slider');
  }

  it('is a labelled slider that starts in the middle', () => {
    const slider = setup();
    expect(slider).toHaveAccessibleName('Compare the original page with the copy');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-valuenow', '50');
    expect(slider).toHaveAttribute('aria-valuetext', '50 percent original, 50 percent copy');
  });

  it('moves with the arrow keys and jumps with Home and End', async () => {
    const slider = setup();
    const user = userEvent.setup();
    slider.focus();
    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '54');
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(slider).toHaveAttribute('aria-valuenow', '46');
    await user.keyboard('{Home}');
    expect(slider).toHaveAttribute('aria-valuenow', '0');
    expect(slider).toHaveAttribute('aria-valuetext', 'Showing only the copy');
    await user.keyboard('{End}');
    expect(slider).toHaveAttribute('aria-valuenow', '100');
    expect(slider).toHaveAttribute('aria-valuetext', 'Showing only the original');
  });

  it('follows a pointer press on the stage', () => {
    const slider = setup();
    const stage = slider.closest('[style*="aspect-ratio"]') as HTMLElement;
    stage.getBoundingClientRect = () =>
      ({ left: 100, width: 400, top: 0, height: 300, right: 500, bottom: 300 }) as DOMRect;
    fireEvent.pointerDown(stage, { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 200 });
    expect(slider).toHaveAttribute('aria-valuenow', '25');
  });

  it('keeps both exhibits and the numbered differences as real text', () => {
    setup();
    expect(screen.getByText('original page')).toBeInTheDocument();
    expect(screen.getByText('copy page')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(ACME_DIFFERENCES.length);
    expect(screen.getByText('Sample pages of a fictional brand')).toBeInTheDocument();
  });
});

describe('AcmeSheet', () => {
  it('shows the look-alike address and outlines the four differences when annotated', () => {
    stubMotionPreference(true);
    const { container } = render(<AcmeSheet variant="copy" annotated />);
    expect(screen.getByText('acrne.com')).toBeInTheDocument();
    expect(screen.getByText('Forgot pasword?')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-diff]')).toHaveLength(4);
  });

  it('never outlines the original', () => {
    stubMotionPreference(true);
    const { container } = render(<AcmeSheet variant="original" annotated />);
    expect(screen.getByText('acme.com')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-diff]')).toHaveLength(0);
  });
});

describe('LetterSwap', () => {
  it('reads as the final state, and says what changed', () => {
    stubMotionPreference(true);
    render(<LetterSwap from="acme.com" to="acrne.com" />);
    expect(
      screen.getByText('acrne.com, a look-alike of acme.com: “m” is replaced by “rn”'),
    ).toHaveClass('sr-only');
  });

  it('rolls only the changed letters, ending in the final position', () => {
    stubMotionPreference(true);
    const { container } = render(<LetterSwap from="acme.com" to="acrne.com" />);
    const visible = container.querySelector('[aria-hidden]') as HTMLElement;
    const incoming = within(visible).getAllByText(/^(r|n)$/);
    expect(incoming.map((node) => node.textContent)).toEqual(['r', 'n']);
    incoming.forEach((node) => expect(node.style.transform).toMatch(/^translateY\(0(px)?\)$/));
    const outgoing = within(visible).getByText('m');
    expect(outgoing.style.transform).toBe('translateY(-125%)');
  });

  it('handles an inserted word (acme.com to acme-login.com)', () => {
    stubMotionPreference(true);
    render(<LetterSwap from="acme.com" to="acme-login.com" />);
    expect(
      screen.getByText('acme-login.com, a look-alike of acme.com: adds “-login”'),
    ).toBeInTheDocument();
  });

  it('shows plain text when nothing changed', () => {
    stubMotionPreference(false);
    const { container } = render(<LetterSwap from="acme.com" to="acme.com" />);
    expect(container.querySelector('[aria-hidden]')).toHaveTextContent('acme.com');
  });
});

describe('StampSlam', () => {
  it('prints the verdict and the detail as real text', () => {
    stubMotionPreference(true);
    render(<StampSlam text="Lookalike · 92" detail="Case 0412 · acrne.com" />);
    expect(screen.getByText('Lookalike · 92')).toBeInTheDocument();
    expect(screen.getByText('Case 0412 · acrne.com')).toBeInTheDocument();
  });
});

describe('IsometricStack', () => {
  const layers = [
    { label: 'Websites', detail: 'Look-alike domains and cloned pages' },
    { label: 'Apps', detail: 'Copies in the app stores' },
    { label: 'Trademarks', detail: 'New filings that sound like yours' },
    { label: 'Evidence', detail: 'Everything kept for the takedown' },
  ];

  it('lists every layer with its detail, always visible', () => {
    stubMotionPreference(true);
    render(<IsometricStack layers={layers} />);
    const items = within(screen.getByRole('list', { name: 'Layers' })).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent('01Websites');
    expect(items[0]).toHaveTextContent('Look-alike domains and cloned pages');
  });

  it('lets a label be pressed to lift its sheet, and pressed again to let go', async () => {
    stubMotionPreference(true);
    render(<IsometricStack layers={layers} />);
    const user = userEvent.setup();
    const apps = screen.getByRole('button', { name: /Apps/ });
    expect(apps).toHaveAttribute('aria-pressed', 'false');
    await user.click(apps);
    expect(apps).toHaveAttribute('aria-pressed', 'true');
    await user.click(apps);
    expect(apps).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('Loupe', () => {
  it('shows the page, a description for screen readers and the annotated lens', () => {
    stubMotionPreference(true);
    render(
      <Loupe
        magnified={<p>annotated view</p>}
        description="The lens shows the changed letters in the logo."
      >
        <p>the page</p>
      </Loupe>,
    );
    expect(screen.getByText('the page')).toBeInTheDocument();
    expect(screen.getByText('annotated view')).toBeInTheDocument();
    expect(screen.getByText('The lens shows the changed letters in the logo.')).toHaveClass(
      'sr-only',
    );
    expect(
      screen.getByRole('group', { name: 'Exhibit with a magnifying glass' }),
    ).toBeInTheDocument();
  });

  it('can be focused and moved with the keyboard when motion is allowed', async () => {
    stubMotionPreference(false);
    render(
      <Loupe magnified={<p>annotated view</p>}>
        <p>the page</p>
      </Loupe>,
    );
    const stage = screen.getByRole('group', { name: 'Exhibit with a magnifying glass' });
    expect(stage).toHaveAttribute('tabindex', '0');
    const user = userEvent.setup();
    stage.focus();
    await user.keyboard('{ArrowRight}{Escape}');
    expect(stage).toBeInTheDocument();
  });

  it('stays still and out of the tab order with reduced motion', () => {
    stubMotionPreference(true);
    render(
      <Loupe magnified={<p>annotated view</p>}>
        <p>the page</p>
      </Loupe>,
    );
    expect(screen.getByRole('group')).not.toHaveAttribute('tabindex');
  });
});

describe('NumberRoll', () => {
  it('keeps the final number in the DOM for assistive tech', () => {
    stubMotionPreference(false);
    render(<NumberRoll value={1542922} suffix="+" />);
    expect(screen.getByText('1,542,922+')).toHaveClass('sr-only');
  });

  it('shows the final number at once with reduced motion', () => {
    stubMotionPreference(true);
    const { container } = render(<NumberRoll value={77} suffix="%" />);
    expect(container.querySelector('[aria-hidden]')).toHaveTextContent('77%');
  });

  it('formats decimals', () => {
    stubMotionPreference(true);
    render(<NumberRoll value={4.5} decimals={1} suffix="x" />);
    expect(screen.getByText('4.5x', { selector: '.sr-only' })).toBeInTheDocument();
  });

  it('builds a rolling column for every digit and leaves the commas alone', () => {
    stubMotionPreference(false);
    const { container } = render(<NumberRoll value={12345} />);
    const visible = container.querySelector('[aria-hidden]') as HTMLElement;
    expect(visible.querySelectorAll('[data-digit]')).toHaveLength(5);
    expect(visible.textContent?.includes(',')).toBe(true);
  });
});
