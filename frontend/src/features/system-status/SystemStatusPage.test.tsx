import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SystemStatusPage } from './SystemStatusPage';

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SystemStatusPage />
    </QueryClientProvider>,
  );
}

describe('SystemStatusPage', () => {
  it('shows a loading state, then each dependency', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          success: true,
          data: {
            status: 'degraded',
            checkedAt: '2026-11-07T10:00:00.000Z',
            dependencies: [
              {
                name: 'database',
                critical: true,
                status: 'not_configured',
                message: 'MONGODB_URI is not set',
              },
              {
                name: 'aiService',
                critical: false,
                status: 'up',
                message: 'Reachable',
                latencyMs: 12,
              },
            ],
          },
        }),
      ),
    );

    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('Checking services');

    expect(await screen.findByText('Partially available')).toBeInTheDocument();
    expect(screen.getByText('Similo API')).toBeInTheDocument();
    expect(screen.getByText('MongoDB Atlas')).toBeInTheDocument();
    expect(screen.getByText('Not configured')).toBeInTheDocument();
    expect(screen.getByText('AI intelligence service')).toBeInTheDocument();
    expect(screen.getByText('12 ms')).toBeInTheDocument();
  });

  it('shows an error when the API cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('The API could not be reached');
  });
});
