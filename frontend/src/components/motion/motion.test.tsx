import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CountUp } from './CountUp';
import { ScrollStory } from './ScrollStory';
import { useLoop } from './useLoop';

function stubReducedMotion(reduce: boolean) {
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

afterEach(() => {
  vi.useRealTimers();
});

describe('useLoop', () => {
  it('advances and wraps around', () => {
    stubReducedMotion(false);
    vi.useFakeTimers();
    const { result } = renderHook(() => useLoop(3, 1000));
    expect(result.current).toBe(0);
    act(() => void vi.advanceTimersByTime(1000));
    expect(result.current).toBe(1);
    act(() => void vi.advanceTimersByTime(2000));
    expect(result.current).toBe(0);
  });

  it('shows the finished scene and never moves with reduced motion', () => {
    stubReducedMotion(true);
    vi.useFakeTimers();
    const { result } = renderHook(() => useLoop(5, 1000));
    expect(result.current).toBe(4);
    act(() => void vi.advanceTimersByTime(3000));
    expect(result.current).toBe(4);
  });
});

describe('CountUp', () => {
  it('keeps the final value in the DOM for assistive tech', () => {
    stubReducedMotion(false);
    render(<CountUp value={1542922} suffix="+" />);
    expect(screen.getByText('1,542,922+')).toHaveClass('sr-only');
  });

  it('shows the final value immediately with reduced motion', () => {
    stubReducedMotion(true);
    const { container } = render(<CountUp value={77} suffix="%" />);
    expect(container.querySelector('[aria-hidden]')).toHaveTextContent('77%');
  });
});

describe('ScrollStory', () => {
  it('renders every step as text in reading order', () => {
    stubReducedMotion(false);
    render(
      <ScrollStory
        steps={[
          { id: 'a', label: 'Watch', title: 'First title', body: 'First body', visual: <p>v1</p> },
          {
            id: 'b',
            label: 'Explain',
            title: 'Second title',
            body: 'Second body',
            visual: <p>v2</p>,
          },
        ]}
      />,
    );
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['First title', 'Second title']);
    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('aria-current', 'step');
  });
});
