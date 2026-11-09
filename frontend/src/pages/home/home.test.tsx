import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { HomePage } from '../HomePage';

function stubBrowser(reduced: boolean) {
  // jsdom has no canvas: the 3D scenes and the wave fall back quietly.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduced && query.includes('reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
}

function renderHome() {
  const router = createMemoryRouter([{ path: '/', element: <HomePage /> }]);
  return render(<RouterProvider router={router} />);
}

describe('HomePage (v6)', () => {
  it('has one h1 and keeps the #check anchor for the brand checker', () => {
    stubBrowser(true);
    const { container } = renderHome();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/copycats/);
    expect(container.querySelector('#check')).not.toBeNull();
    expect(screen.getByLabelText('Your brand name')).toHaveValue('acme');
  });

  it('numbers its plates and labels every sample scene', () => {
    stubBrowser(true);
    renderHome();
    for (const index of ['02', '03', '04', '05', '06', '07', '08', '09', '10']) {
      expect(screen.getAllByText(new RegExp(`Fig\\. ${index}`, 'i')).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByText(/fictional brand Acme/i).length).toBeGreaterThan(0);
  });

  it('shows the compare slider and the steps without motion', () => {
    stubBrowser(true);
    renderHome();
    expect(screen.getByRole('slider', { name: /compare your sign-in page/i })).toBeInTheDocument();
    for (const step of ['Every new name, every day.', 'A person makes the call.']) {
      expect(screen.getByRole('heading', { level: 3, name: step })).toBeInTheDocument();
    }
  });
});
