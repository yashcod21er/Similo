import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Preloader } from '@/components/site/Preloader';
import { introDelay, introPlays, resetIntroForTests } from './intro';

function stubMedia(matching: string[]) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: matching.some((part) => query.includes(part)),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
  resetIntroForTests();
});

describe('intro', () => {
  it('plays on the first visit in a session only', () => {
    stubMedia([]);
    expect(introPlays()).toBe(true);
    expect(introPlays()).toBe(true); // same answer for the whole page load
    expect(introDelay()).toBeGreaterThan(0);
    resetIntroForTests(); // a reload in the same tab
    expect(introPlays()).toBe(false);
    expect(introDelay()).toBe(0);
  });

  it('never plays with reduced motion', () => {
    stubMedia(['reduce']);
    expect(introPlays()).toBe(false);
  });

  it('is decorative and hidden from assistive tech', () => {
    stubMedia([]);
    render(<Preloader />);
    expect(screen.getByTestId('intro')).toHaveAttribute('aria-hidden', 'true');
  });
});
