import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Permission } from '@/features/auth/api';
import { buildSignalRows, captureProblem } from './analysis';
import { PENDING_POLL_MS, type Finding, type FindingAnalysis } from './api';
import { FindingDetailPage } from './FindingDetailPage';
import { FindingsPage } from './FindingsPage';

/* ------------------------------------------------------------------ Fixtures */

const READ: Permission[] = ['organization:read', 'members:read', 'brands:read', 'findings:read'];
const WORKER: Permission[] = [...READ, 'findings:update'];

function me(role: 'analyst' | 'viewer') {
  return {
    user: { id: 'u1', name: 'Asha Rao', email: 'asha@acme.example' },
    organization: { id: 'o1', name: 'Acme Brands' },
    role,
    roleLabel: role === 'analyst' ? 'Investigation Analyst' : 'Viewer',
    permissions: role === 'analyst' ? WORKER : READ,
  };
}

const NOW = '2026-11-09T09:30:00.000Z';

const SIGNALS = [
  {
    id: 'brand_mention',
    label: 'Brand name on the page',
    value: 1,
    points: 10,
    maxPoints: 10,
    detail: 'The brand name "Acme" appears in the page title.',
  },
  {
    id: 'domain_similarity',
    label: 'Domain name',
    value: 0.84,
    points: 21,
    maxPoints: 25,
    detail: 'The name "acrne-login" is very close to "acme".',
  },
  {
    id: 'logo_match',
    label: 'Logo',
    value: 0.91,
    points: 22,
    maxPoints: 25,
    detail: 'A logo on the page looks 91% like your logo.',
  },
];

function makeAnalysis(overrides: Partial<FindingAnalysis> = {}): FindingAnalysis {
  return {
    status: 'complete',
    score: 53,
    level: 'medium',
    signals: SIGNALS,
    reasons: ['A logo on the page looks like your logo.', 'The domain name is close to "acme".'],
    unavailable: ['new_certificate'],
    capture: {
      status: 'captured',
      finalUrl: 'https://acrne-login.example/sign-in',
      title: 'Acme | Sign in',
      hasScreenshot: true,
      capturedAt: NOW,
    },
    logoMatch: { logoId: 'l7', source: 'favicon', similarity: 0.91, method: 'clip' },
    modelVersion: 'similo-risk-1',
    analysedAt: NOW,
    error: null,
    ...overrides,
  };
}

const EMPTY_ANALYSIS: Partial<FindingAnalysis> = {
  score: null,
  level: null,
  signals: [],
  reasons: [],
  unavailable: [],
  capture: null,
  logoMatch: null,
  modelVersion: null,
  analysedAt: null,
};

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f1',
    brandId: 'b1',
    brandName: 'Acme',
    domain: 'acrne-login.example',
    source: 'fixture',
    sourceReferences: [],
    score: 82,
    matchedTerm: 'acme',
    reasons: ['Looks like "acme": "rn" is easy to read as "m".'],
    registration: { registeredAt: NOW, registrar: null, nameservers: [], checkedAt: null },
    status: 'new',
    analysis: makeAnalysis(),
    firstSeenAt: NOW,
    lastSeenAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

/* ------------------------------------------------------------------ Test API */

const ok = (data: unknown, status = 200) => Response.json({ success: true, data }, { status });
const fail = (status: number, code: string, message: string) =>
  Response.json({ success: false, error: { code, message, requestId: 'r' } }, { status });

interface Call {
  method: string;
  path: string;
  search: string;
}

/** Stands in for the whole API. /auth/me is built in; every other request is recorded. */
function stubApi(role: 'analyst' | 'viewer', handler: (call: Call) => Response | undefined) {
  const calls: Call[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const [path = '', search = ''] = url.replace('/api/v1', '').split('?');
      if (path === '/auth/me') return ok(me(role));
      const call: Call = { method: init.method ?? 'GET', path, search };
      calls.push(call);
      return handler(call) ?? fail(404, 'NOT_FOUND', `No fake answer for ${call.method} ${path}`);
    }),
  );
  return calls;
}

function renderAt(initialPath: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: '/app/findings', element: <FindingsPage /> },
      { path: '/app/findings/:findingId', element: <FindingDetailPage /> },
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

const showFinding = (finding: Finding) => (call: Call) =>
  call.path === '/findings/f1' && call.method === 'GET' ? ok(finding) : undefined;

afterEach(() => {
  vi.useRealTimers();
});

/* ------------------------------------------------------------- Finding page */

describe('FindingDetailPage: a complete analysis', () => {
  it('shows the risk, every signal, the reasons and the evidence', async () => {
    stubApi('analyst', showFinding(makeFinding()));
    renderAt('/app/findings/f1');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'acrne-login.example' }),
    ).toBeInTheDocument();

    // The risk is a number AND a word, with a labelled meter.
    const risk = screen.getByRole('heading', { name: 'Risk level' }).closest('section');
    expect(risk).not.toBeNull();
    expect(within(risk as HTMLElement).getByText('Medium risk')).toBeInTheDocument();
    const riskMeter = within(risk as HTMLElement).getByRole('meter', { name: 'Risk score' });
    expect(riskMeter).toHaveAttribute('aria-valuenow', '53');
    expect(riskMeter).toHaveAttribute('aria-valuetext', '53 out of 100, medium risk');
    expect(within(risk as HTMLElement).getByText('similo-risk-1')).toBeInTheDocument();
    expect(
      screen.getByText(
        "Similo's AI suggests a risk level. A person on your team decides what happens next.",
      ),
    ).toBeInTheDocument();

    // Every signal is a row with points, a bar and a plain sentence, in the fixed order.
    const why = screen.getByRole('heading', { name: 'Why this score' }).closest('section');
    const items = within(why as HTMLElement).getAllByRole('listitem');
    const rowTitles = items
      .map((item) => item.querySelector('p')?.textContent)
      .filter((text) => text === 'Domain name' || text === 'Logo' || text?.startsWith('Brand'));
    expect(rowTitles).toEqual(['Domain name', 'Logo', 'Brand name on the page']);
    expect(
      within(why as HTMLElement).getByRole('meter', { name: 'Domain name: points' }),
    ).toHaveAttribute('aria-valuetext', '21 out of 25 points');
    expect(within(why as HTMLElement).getByText('21')).toBeInTheDocument();
    expect(
      within(why as HTMLElement).getByText('A logo on the page looks 91% like your logo.'),
    ).toBeInTheDocument();

    // A check that could not be made says so, with a reason.
    expect(within(why as HTMLElement).getByText('New certificate')).toBeInTheDocument();
    expect(within(why as HTMLElement).getByText('Not checked')).toBeInTheDocument();
    // The reasons list.
    expect(
      within(why as HTMLElement).getByText('The domain name is close to "acme".'),
    ).toBeInTheDocument();

    // Evidence: the matched logo and the screenshot are images; the address is text.
    expect(screen.getByAltText('Acme logo, the original that matched')).toHaveAttribute(
      'src',
      '/api/v1/brands/b1/logos/l7',
    );
    expect(
      screen.getByAltText(
        'Screenshot of the suspect page for acrne-login.example, taken by Similo',
      ),
    ).toHaveAttribute('src', '/api/v1/findings/f1/screenshot');
    expect(screen.getByText('https://acrne-login.example/sign-in')).toBeInTheDocument();
    expect(screen.getByText('Acme | Sign in')).toBeInTheDocument();
    expect(screen.getByText('Exhibit A')).toBeInTheDocument();
    expect(screen.getByText('Exhibit B')).toBeInTheDocument();

    expect(await screen.findByRole('button', { name: 'Analyse again' })).toBeInTheDocument();
  });

  it('never links to the suspect site and offers to copy the domain', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    stubApi('analyst', showFinding(makeFinding()));
    renderAt('/app/findings/f1');
    await screen.findByRole('heading', { level: 1, name: 'acrne-login.example' });

    const suspect = document.querySelectorAll('a[href*="acrne-login"]');
    // Only the saved screenshot (our own API) may mention it; nothing leaves Similo.
    for (const link of suspect) expect(link.getAttribute('href')).toMatch(/^\/api\/v1\//);
    expect(screen.queryByRole('link', { name: 'acrne-login.example' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Copy domain' }));
    expect(writeText).toHaveBeenCalledWith('acrne-login.example');
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it("falls back to the brand's first logo when no logo matched", async () => {
    const finding = makeFinding({ analysis: makeAnalysis({ logoMatch: null }) });
    stubApi('analyst', (call) =>
      call.path === '/brands/b1'
        ? ok({
            id: 'b1',
            name: 'Acme',
            logos: [
              { id: 'l1', fileName: 'a.png', contentType: 'image/png', size: 1, uploadedAt: NOW },
            ],
          })
        : showFinding(finding)(call),
    );
    renderAt('/app/findings/f1');

    expect(await screen.findByAltText('Acme logo, the original')).toHaveAttribute(
      'src',
      '/api/v1/brands/b1/logos/l1',
    );
  });
});

describe('FindingDetailPage: other states', () => {
  it('explains that nothing has been analysed yet', async () => {
    stubApi('analyst', showFinding(makeFinding({ analysis: null })));
    renderAt('/app/findings/f1');

    expect(await screen.findByText('Not analysed yet')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Run analysis' })).toBeInTheDocument();
    // The name check from the scan is still shown.
    expect(screen.getByRole('heading', { name: 'What the name check found' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Why this score' })).not.toBeInTheDocument();
  });

  it('polls while the analysis is pending and stops once it is complete', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const pending = makeFinding({
      analysis: makeAnalysis({ ...EMPTY_ANALYSIS, status: 'pending' }),
    });
    let reads = 0;
    const calls = stubApi('analyst', (call) => {
      if (call.path !== '/findings/f1') return undefined;
      reads += 1;
      return ok(reads === 1 ? pending : makeFinding());
    });
    renderAt('/app/findings/f1');

    expect(await screen.findByText('Analysis in progress')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Analyse again' })).not.toBeInTheDocument();
    expect(reads).toBe(1);

    await vi.advanceTimersByTimeAsync(PENDING_POLL_MS + 200);
    expect(await screen.findByRole('heading', { name: 'Why this score' })).toBeInTheDocument();
    expect(screen.queryByText('Analysis in progress')).not.toBeInTheDocument();
    expect(reads).toBe(2);

    // Complete: no more requests, however long we wait.
    await vi.advanceTimersByTimeAsync(PENDING_POLL_MS * 4);
    expect(calls.filter((call) => call.path === '/findings/f1')).toHaveLength(2);
  });

  it('says when the AI service or worker is not available', async () => {
    const finding = makeFinding({
      analysis: makeAnalysis({ ...EMPTY_ANALYSIS, status: 'unavailable' }),
    });
    stubApi('analyst', showFinding(finding));
    renderAt('/app/findings/f1');

    expect(await screen.findByText('Analysis is not available right now')).toBeInTheDocument();
    expect(
      screen.getByText(/The AI service or the background worker is not set up/),
    ).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Analyse again' })).toBeInTheDocument();
  });

  it("shows a failed analysis's error", async () => {
    const finding = makeFinding({
      analysis: makeAnalysis({
        ...EMPTY_ANALYSIS,
        status: 'failed',
        error: 'The AI service took too long to answer.',
      }),
    });
    stubApi('analyst', showFinding(finding));
    renderAt('/app/findings/f1');

    expect(await screen.findByText('The analysis did not finish')).toBeInTheDocument();
    expect(screen.getByText('The AI service took too long to answer.')).toBeInTheDocument();
  });

  it.each([
    ['unreachable', 'The site did not answer.'],
    ['blocked', 'Our safety checks did not allow the visit.'],
  ] as const)('explains a %s site and keeps the name-only result', async (status, detail) => {
    const finding = makeFinding({
      analysis: makeAnalysis({
        score: 21,
        level: 'low',
        signals: [SIGNALS[1]!],
        unavailable: ['logo_match', 'brand_mention'],
        capture: { status, finalUrl: null, title: null, hasScreenshot: false, capturedAt: null },
        logoMatch: null,
      }),
    });
    stubApi('analyst', (call) =>
      call.path === '/brands/b1'
        ? ok({ id: 'b1', name: 'Acme', logos: [] })
        : showFinding(finding)(call),
    );
    renderAt('/app/findings/f1');

    const messages = await screen.findAllByText(
      'We could not open the site safely, so only the name and registration were checked.',
    );
    expect(messages.length).toBeGreaterThanOrEqual(2); // risk panel and Exhibit B
    expect(screen.getAllByText(detail).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Not checked')).toHaveLength(2);
    expect(screen.getAllByText('Needs the suspect page, which we could not open.')).toHaveLength(2);
    expect(screen.queryByAltText(/Screenshot of the suspect page/)).not.toBeInTheDocument();
    expect(await screen.findByText(/No logo has been uploaded for Acme/)).toBeInTheDocument();
  });

  it('shows a plain message for a finding that does not exist', async () => {
    stubApi('analyst', () => fail(404, 'NOT_FOUND', 'That finding does not exist.'));
    renderAt('/app/findings/nope');

    expect(await screen.findByRole('heading', { name: 'Finding not found' })).toBeInTheDocument();
  });
});

describe('FindingDetailPage: who may analyse', () => {
  it('hides "Analyse again" and the status control from a viewer', async () => {
    stubApi('viewer', showFinding(makeFinding()));
    renderAt('/app/findings/f1');

    await screen.findByRole('heading', { name: 'Why this score' });
    // Make sure the session (the viewer's permissions) has arrived before checking for absence.
    await waitFor(() =>
      expect(vi.mocked(fetch)).toHaveBeenCalledWith('/api/v1/auth/me', expect.anything()),
    );
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(screen.queryByRole('button', { name: 'Analyse again' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Update status/)).not.toBeInTheDocument();
    // Reading is allowed: the copy button stays.
    expect(screen.getByRole('button', { name: 'Copy domain' })).toBeInTheDocument();
  });

  it('asks for a new analysis and then shows it as running', async () => {
    let analysed = false;
    const calls = stubApi('analyst', (call) => {
      if (call.path === '/findings/f1/analyse' && call.method === 'POST') {
        analysed = true;
        return ok({ analysis: { status: 'pending' } }, 202);
      }
      if (call.path === '/findings/f1') {
        return ok(
          analysed
            ? makeFinding({ analysis: makeAnalysis({ ...EMPTY_ANALYSIS, status: 'pending' }) })
            : makeFinding(),
        );
      }
      return undefined;
    });
    renderAt('/app/findings/f1');

    await userEvent.click(await screen.findByRole('button', { name: 'Analyse again' }));

    expect(await screen.findByText('Analysis in progress')).toBeInTheDocument();
    expect(
      calls.some((call) => call.method === 'POST' && call.path === '/findings/f1/analyse'),
    ).toBe(true);
  });

  it('turns a 503 into a friendly message', async () => {
    stubApi('analyst', (call) =>
      call.method === 'POST'
        ? fail(503, 'SERVICE_UNAVAILABLE', 'The queue is offline.')
        : showFinding(makeFinding())(call),
    );
    renderAt('/app/findings/f1');

    await userEvent.click(await screen.findByRole('button', { name: 'Analyse again' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('The analysis service is not available right now.');
    expect(alert).not.toHaveTextContent('queue');
    // The existing result is still on the page.
    expect(screen.getByRole('heading', { name: 'Why this score' })).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------- Findings list */

describe('FindingsPage: risk', () => {
  const listed = [
    makeFinding({ id: 'f1' }),
    makeFinding({ id: 'f2', domain: 'acme-help.example', analysis: null }),
    makeFinding({
      id: 'f3',
      domain: 'acme-pay.example',
      analysis: makeAnalysis({ score: 81, level: 'high', signals: undefined }),
    }),
  ];

  it('shows each finding with its risk, or "Not analysed", and links to the detail page', async () => {
    stubApi('analyst', ({ path }) =>
      path === '/findings' ? ok({ findings: listed, nextCursor: null }) : undefined,
    );
    renderAt('/app/findings');

    const first = (await screen.findByRole('link', { name: 'acrne-login.example' })).closest(
      'article',
    ) as HTMLElement;
    expect(first).not.toBeNull();
    expect(screen.getByRole('link', { name: 'acrne-login.example' })).toHaveAttribute(
      'href',
      '/app/findings/f1',
    );
    expect(within(first).getByText('Medium risk')).toBeInTheDocument();
    expect(within(first).getByText('53')).toBeInTheDocument();

    const second = screen.getByRole('link', { name: 'acme-help.example' }).closest('article');
    expect(within(second as HTMLElement).getByText('Not analysed')).toBeInTheDocument();
    const third = screen.getByRole('link', { name: 'acme-pay.example' }).closest('article');
    expect(within(third as HTMLElement).getByText('High risk')).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: 'View details for acme-help.example' }),
    ).toHaveAttribute('href', '/app/findings/f2');
  });

  it('sends sort=risk only when "Highest risk" is chosen', async () => {
    const calls = stubApi('analyst', ({ path }) =>
      path === '/findings' ? ok({ findings: listed, nextCursor: null }) : undefined,
    );
    const router = renderAt('/app/findings');
    await screen.findByRole('link', { name: 'acrne-login.example' });
    expect(calls.at(-1)?.search).not.toContain('sort=');

    await userEvent.selectOptions(screen.getByLabelText('Sort by'), 'Highest risk');

    await waitFor(() => expect(calls.at(-1)?.search).toContain('sort=risk'));
    expect(router.state.location.search).toBe('?sort=risk');

    await userEvent.selectOptions(screen.getByLabelText('Sort by'), 'Most recent');
    await waitFor(() => expect(router.state.location.search).toBe(''));
    expect(calls.at(-1)?.search).not.toContain('sort=');
  });

  it('keeps the status filter and the order together', async () => {
    const calls = stubApi('analyst', ({ path }) =>
      path === '/findings' ? ok({ findings: [], nextCursor: null }) : undefined,
    );
    renderAt('/app/findings?status=reviewing&sort=risk');
    await screen.findByText('No findings yet');

    const search = new URLSearchParams(calls.at(-1)?.search);
    expect(search.get('status')).toBe('reviewing');
    expect(search.get('sort')).toBe('risk');
  });
});

/* ------------------------------------------------------------ Pure helpers */

describe('analysis helpers', () => {
  it('lists the checks in a fixed order and marks the missing ones', () => {
    const rows = buildSignalRows(
      makeAnalysis({
        signals: [SIGNALS[0]!, SIGNALS[2]!, SIGNALS[1]!],
        unavailable: ['new_domain', 'text_similarity'],
        capture: null,
      }),
    );
    expect(rows.map((row) => [row.id, row.kind])).toEqual([
      ['domain_similarity', 'scored'],
      ['logo_match', 'scored'],
      ['text_similarity', 'unavailable'],
      ['brand_mention', 'scored'],
      ['new_domain', 'unavailable'],
    ]);
    const missing = rows.filter((row) => row.kind === 'unavailable');
    expect(missing.map((row) => row.label)).toEqual(['Page wording', 'New domain']);
    expect(missing[1]).toMatchObject({
      reason: 'No registration date was available for this domain.',
    });
  });

  it('treats a check that is both scored and unavailable as not checked', () => {
    const rows = buildSignalRows(makeAnalysis({ unavailable: ['logo_match'] }));
    const logo = rows.find((row) => row.id === 'logo_match');
    expect(logo?.kind).toBe('unavailable');
    expect(rows.filter((row) => row.id === 'logo_match')).toHaveLength(1);
  });

  it('only reports a capture problem when the page was not captured', () => {
    expect(captureProblem(null)).toBeNull();
    expect(
      captureProblem({
        status: 'captured',
        finalUrl: null,
        title: null,
        hasScreenshot: true,
        capturedAt: null,
      }),
    ).toBeNull();
    expect(
      captureProblem({
        status: 'failed',
        finalUrl: null,
        title: null,
        hasScreenshot: false,
        capturedAt: null,
      })?.headline,
    ).toBe('We could not open the site safely, so only the name and registration were checked.');
  });
});
