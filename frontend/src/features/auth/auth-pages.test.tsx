import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { RequireAuth } from './RequireAuth';
import { SignInPage } from './SignInPage';
import { safeNextPath } from './api';

const ME = {
  user: { id: '1', name: 'Asha Rao', email: 'asha@acme.example' },
  organization: { id: '2', name: 'Acme Brands' },
  role: 'owner',
  roleLabel: 'Owner',
  permissions: ['organization:read', 'members:manage'],
};

function json(status: number, body: unknown) {
  return Response.json(body, { status });
}

const unauthenticated = () =>
  json(401, {
    success: false,
    error: { code: 'UNAUTHENTICATED', message: 'Please sign in to continue.', requestId: 'r' },
  });

/** Renders `initialPath` with real routing, so redirects can be observed. */
function renderAt(initialPath: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: '/sign-in', element: <SignInPage /> },
      {
        path: '/app/*',
        element: (
          <RequireAuth>
            <p>Private dashboard</p>
          </RequireAuth>
        ),
      },
    ],
    { initialEntries: [initialPath] },
  );
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe('RequireAuth', () => {
  it('sends visitors without a session to sign in, remembering where they were going', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => unauthenticated()),
    );
    const router = renderAt('/app/members');
    expect(await screen.findByRole('heading', { name: 'Sign in to Similo' })).toBeInTheDocument();
    expect(router.state.location.search).toBe('?next=%2Fapp%2Fmembers');
  });

  it('shows the workspace to signed-in people', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json(200, { success: true, data: ME })),
    );
    renderAt('/app');
    expect(await screen.findByText('Private dashboard')).toBeInTheDocument();
  });
});

describe('SignInPage', () => {
  it('checks the fields before sending anything', async () => {
    const fetchMock = vi.fn(async (_url: string) => unauthenticated());
    vi.stubGlobal('fetch', fetchMock);
    renderAt('/sign-in');

    await userEvent.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
    // Only the "who am I?" check went out — no sign-in request.
    expect(fetchMock.mock.calls.every(([url]) => String(url).endsWith('/auth/me'))).toBe(true);
  });

  it("shows the API's plain message when the password is wrong", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('/auth/me')
          ? unauthenticated()
          : json(401, {
              success: false,
              error: {
                code: 'INVALID_CREDENTIALS',
                message: 'Email or password is incorrect.',
                requestId: 'r',
              },
            }),
      ),
    );
    renderAt('/sign-in');

    await userEvent.type(await screen.findByLabelText('Work email'), 'asha@acme.example');
    await userEvent.type(screen.getByLabelText('Password'), 'not the right one');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
  });

  it('goes to the page the visitor asked for after signing in', async () => {
    let signedIn = false;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/auth/sign-in')) {
          signedIn = true;
          return json(200, { success: true, data: ME });
        }
        return signedIn ? json(200, { success: true, data: ME }) : unauthenticated();
      }),
    );
    const router = renderAt('/sign-in?next=%2Fapp%2Fmembers');

    await userEvent.type(await screen.findByLabelText('Work email'), 'asha@acme.example');
    await userEvent.type(screen.getByLabelText('Password'), 'correct horse battery staple');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Private dashboard')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/app/members');
  });
});

describe('safeNextPath', () => {
  it('only allows same-site paths, so a link cannot redirect to another website', () => {
    expect(safeNextPath('/app/members')).toBe('/app/members');
    expect(safeNextPath('https://evil.example')).toBe('/app');
    expect(safeNextPath('//evil.example')).toBe('/app');
    expect(safeNextPath(null)).toBe('/app');
  });
});
