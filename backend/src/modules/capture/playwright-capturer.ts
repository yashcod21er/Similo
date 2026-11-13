import { chromium, type Browser, type ElementHandle, type Page, type Response } from 'playwright';
import type { Logger } from '../../lib/logger.js';
import {
  CAPTURE_LIMITS,
  type CapturedForms,
  type CapturedImage,
  type CapturedImageKind,
  type CaptureResult,
  type PageCapturer,
} from './capture.types.js';
import { startGuardProxy, type Dialer, type GuardProxy, type Resolver } from './guard-proxy.js';
import { checkTargetUrl } from './url-policy.js';

/**
 * Captures a suspect page in a locked-down headless Chromium.
 *
 * Safety measures (suspect sites may be malicious):
 * - a fresh browser and a fresh SSRF guard proxy per capture; every request goes
 *   through the proxy (see guard-proxy.ts), loopback included, and Chromium's own
 *   DNS is disabled so a request that somehow skipped the proxy could not resolve;
 * - Chromium's sandbox on, QUIC and background networking off, WebRTC limited to
 *   the proxy, WebSockets closed, service workers blocked, downloads refused;
 * - a fresh context with no cookies or stored state; popups closed, dialogs
 *   dismissed; the capture never clicks, types or submits anything;
 * - the browser gets a minimal environment, so server secrets in process.env
 *   are not visible to it;
 * - a 20-second navigation timeout and a 45-second hard limit for the whole capture.
 */

export interface PlaywrightCapturerOptions {
  /** `msedge` or `chrome` for an installed browser; undefined = Playwright's Chromium. */
  browserChannel?: string;
  logger?: Logger;
  /**
   * Test seam: how the guard proxy resolves names and opens connections.
   * Production always uses real DNS and direct connections; the address checks
   * themselves cannot be switched off.
   */
  network?: { resolve?: Resolver; dial?: Dialer };
  limits?: Partial<Pick<typeof CAPTURE_LIMITS, 'navigationTimeoutMs' | 'totalTimeoutMs'>>;
}

/** Environment variables the browser genuinely needs; everything else is withheld. */
const BROWSER_ENV_ALLOWLIST = new Set(
  [
    'PATH',
    'PATHEXT',
    'SYSTEMROOT',
    'SYSTEMDRIVE',
    'WINDIR',
    'COMSPEC',
    'TEMP',
    'TMP',
    'TMPDIR',
    'HOME',
    'USERPROFILE',
    'LOCALAPPDATA',
    'APPDATA',
    'PROGRAMDATA',
    'PROGRAMFILES',
    'PROGRAMFILES(X86)',
    'COMMONPROGRAMFILES',
    'COMMONPROGRAMFILES(X86)',
    'NUMBER_OF_PROCESSORS',
    'PROCESSOR_ARCHITECTURE',
    'LANG',
    'LC_ALL',
    'TZ',
    'FONTCONFIG_PATH',
    'FONTCONFIG_FILE',
    'XDG_CACHE_HOME',
    'XDG_CONFIG_HOME',
    'XDG_RUNTIME_DIR',
  ].map((name) => name.toUpperCase()),
);

function browserEnvironment(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [name, value] of Object.entries(process.env)) {
    if (value !== undefined && BROWSER_ENV_ALLOWLIST.has(name.toUpperCase())) env[name] = value;
  }
  return env;
}

function chromiumArgs(proxy: GuardProxy): string[] {
  return [
    `--proxy-server=${proxy.url}`,
    // Chromium bypasses proxies for loopback by default; "<-loopback>" removes that.
    '--proxy-bypass-list=<-loopback>',
    // Defence in depth: the browser's own resolver answers "not found" for every
    // name, so only the proxy (which checks addresses) can reach the network.
    '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1',
    '--disable-quic',
    '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
    '--webrtc-ip-handling-policy=disable_non_proxied_udp',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-domain-reliability',
    '--disable-sync',
    '--no-pings',
    '--no-first-run',
    '--disable-features=InterestFeedContentSuggestions,MediaRouter,OptimizationHints,Translate',
  ];
}

/** Runs before any page script: no popups, no peer-to-peer connections. */
const INIT_SCRIPT = `
  try { window.open = function () { return null; }; } catch (e) {}
  try {
    for (const name of ['RTCPeerConnection', 'webkitRTCPeerConnection', 'RTCDataChannel']) {
      Object.defineProperty(window, name, { value: undefined, configurable: false, writable: false });
    }
  } catch (e) {}
`;

/** Picks visible images, header/nav and "logo" ones first. Runs in the page. */
const PICK_IMAGES_SCRIPT = `(() => {
  const MIN = ${CAPTURE_LIMITS.minImagePx};
  const picked = [];
  const elements = Array.from(document.querySelectorAll('img, svg')).slice(0, 400);
  for (const el of elements) {
    try {
      const tag = el.tagName.toLowerCase();
      if (tag === 'svg' && el.parentElement && el.parentElement.closest('svg')) continue;
      if (tag === 'img' && !(el.complete && el.naturalWidth > 0)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < MIN || r.height < MIN || r.width > 1000 || r.height > 1000) continue;
      if (r.bottom < 0 || r.top > 2400 || r.right < 0 || r.left > ${CAPTURE_LIMITS.viewport.width}) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) continue;
      const inHeader = !!el.closest('header, nav, [role="banner"], [role="navigation"]');
      const parent = el.parentElement;
      const words = [
        el.getAttribute('alt'), el.getAttribute('class'), el.id, el.getAttribute('aria-label'),
        tag === 'img' ? el.getAttribute('src') : '', parent ? parent.getAttribute('class') : '',
        parent ? parent.id : '',
      ].join(' ');
      const logoish = /logo/i.test(words);
      picked.push({ el, kind: inHeader || logoish ? 'logo' : 'image', rank: inHeader ? 0 : logoish ? 1 : 2, top: r.top });
    } catch (e) {}
  }
  picked.sort((a, b) => a.rank - b.rank || a.top - b.top);
  return picked.slice(0, ${CAPTURE_LIMITS.maxImages});
})()`;

/** Reads form signals in one frame. Runs in the page. */
const FORMS_SCRIPT = `(() => {
  const PAY = /(card.?num|cc.?num|cc-?number|cardnumber|cvv|cvc|csc|security.?code|card.?code|exp.?date|expir|cc.?exp)/i;
  let password = false;
  let payment = false;
  for (const el of Array.from(document.querySelectorAll('input, select')).slice(0, 500)) {
    const type = (el.getAttribute('type') || '').toLowerCase();
    const auto = (el.getAttribute('autocomplete') || '').toLowerCase();
    const names = (el.getAttribute('name') || '') + ' ' + (el.id || '');
    if (type === 'password' || /(current|new)-password/.test(auto)) password = true;
    if (/cc-(number|csc|exp)/.test(auto) || PAY.test(names)) payment = true;
  }
  const actions = [];
  for (const form of Array.from(document.forms).slice(0, 50)) {
    try { actions.push(new URL(form.getAttribute('action') || '', document.baseURI).href); } catch (e) {}
  }
  return { password, payment, actions };
})()`;

const FAVICON_SCRIPT = `(() => {
  const link = document.querySelector('link[rel~="icon" i]');
  return link && link.href ? String(link.href) : null;
})()`;

/** Chromium network errors that mean "the site could not be reached". */
const UNREACHABLE =
  /ERR_NAME_NOT_RESOLVED|ERR_NAME_RESOLUTION_FAILED|ERR_CONNECTION_|ERR_TIMED_OUT|ERR_TUNNEL_CONNECTION_FAILED|ERR_EMPTY_RESPONSE|ERR_ADDRESS_UNREACHABLE|ERR_INTERNET_DISCONNECTED|ERR_CERT_|ERR_SSL_|ERR_BAD_SSL|ERR_PROXY_CONNECTION_FAILED|ERR_NETWORK_CHANGED|ERR_HTTP2_|Timeout \d+ms exceeded/i;

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^\[|\]$/g, '').toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Approximate "same site" without a public-suffix list: compares the last two
 * labels, or three when the second-last is a short label under a country code
 * (example.co.uk).
 */
export function siteOf(host: string): string {
  const labels = host.toLowerCase().replace(/\.$/, '').split('.');
  const last = labels.at(-1) ?? '';
  const second = labels.at(-2) ?? '';
  const take = labels.length >= 3 && last.length === 2 && second.length <= 3 ? 3 : 2;
  return labels.slice(-take).join('.');
}

async function withTimeout<T>(work: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    return await Promise.race([work.catch(() => fallback), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export function createPlaywrightCapturer(options: PlaywrightCapturerOptions = {}): PageCapturer {
  const navigationTimeoutMs =
    options.limits?.navigationTimeoutMs ?? CAPTURE_LIMITS.navigationTimeoutMs;
  const totalTimeoutMs = options.limits?.totalTimeoutMs ?? CAPTURE_LIMITS.totalTimeoutMs;
  const logger = options.logger;

  return {
    async capture(rawUrl) {
      const startedAt = new Date();
      const result = (status: Exclude<CaptureResult['status'], 'captured'>, reason: string) =>
        ({ status, capturedAt: startedAt, reason }) satisfies CaptureResult;

      const target = checkTargetUrl(rawUrl);
      if (!target.ok) return result('blocked', target.reason);

      const proxy = await startGuardProxy({
        resolve: options.network?.resolve,
        dial: options.network?.dial,
        maxBytes: CAPTURE_LIMITS.maxBytes,
        maxRequests: CAPTURE_LIMITS.maxRequests,
      });
      let browser: Browser | undefined;
      try {
        // Check the name before starting a browser: most dead or internal names stop here.
        const first = await proxy.resolveTarget(target.host, target.port);
        if (!first.ok) {
          return result(first.outcome === 'blocked' ? 'blocked' : 'unreachable', first.reason);
        }

        const state = { navigated: false };
        const run = (async (): Promise<CaptureResult> => {
          browser = await chromium.launch({
            channel: options.browserChannel || undefined,
            headless: true,
            chromiumSandbox: true,
            env: browserEnvironment(),
            args: chromiumArgs(proxy),
            timeout: 20_000,
          });
          return capturePage(browser, proxy, target.url.href, target.host, startedAt, state);
        })();
        // Never leave a rejection unhandled after the hard timeout wins the race.
        run.catch(() => undefined);

        const outcome = await withTimeout<CaptureResult | 'timeout'>(run, totalTimeoutMs, 'timeout');
        if (outcome === 'timeout') {
          return result(
            state.navigated ? 'failed' : 'unreachable',
            'capture exceeded the time limit',
          );
        }
        return outcome;
      } catch (err) {
        logger?.warn({ err, host: target.host }, 'Page capture failed');
        return result('failed', 'the capture browser failed');
      } finally {
        await (browser as Browser | undefined)?.close().catch(() => undefined);
        await proxy.close().catch(() => undefined);
      }
    },
  };

  async function capturePage(
    browser: Browser,
    proxy: GuardProxy,
    url: string,
    host: string,
    startedAt: Date,
    state: { navigated: boolean },
  ): Promise<CaptureResult> {
    const context = await browser.newContext({
      acceptDownloads: false,
      serviceWorkers: 'block',
      javaScriptEnabled: true,
      viewport: CAPTURE_LIMITS.viewport,
      locale: 'en-US',
      permissions: [],
      ignoreHTTPSErrors: false,
    });
    context.setDefaultNavigationTimeout(navigationTimeoutMs);
    context.setDefaultTimeout(10_000);
    await context.addInitScript({ content: INIT_SCRIPT });

    // Requests the policy refuses before they reach the proxy (scheme, port, IP literal).
    const policyBlocked = new Set<string>();
    await context.route('**/*', async (route) => {
      const check = checkTargetUrl(route.request().url());
      if (!check.ok) {
        policyBlocked.add(hostOf(route.request().url()));
        await route.abort('blockedbyclient').catch(() => undefined);
        return;
      }
      await route.continue().catch(() => undefined);
    });
    // WebSockets are never connected to a server.
    await context.routeWebSocket(/.*/, (ws) => ws.close());

    const page = await context.newPage();
    context.on('page', (other) => {
      if (other !== page) void other.close().catch(() => undefined);
    });
    page.on('dialog', (dialog) => void dialog.dismiss().catch(() => undefined));

    const navigationHosts = new Set<string>([host]);
    page.on('request', (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
        navigationHosts.add(hostOf(request.url()));
      }
    });
    const navigationBlocked = () =>
      proxy.events.some((event) => event.outcome === 'blocked' && navigationHosts.has(event.host)) ||
      [...navigationHosts].some((name) => policyBlocked.has(name));
    const failure = (reason: string): CaptureResult => ({
      status: navigationBlocked() ? 'blocked' : UNREACHABLE.test(reason) ? 'unreachable' : 'failed',
      capturedAt: startedAt,
      reason: reason.split('\n')[0]?.slice(0, 200) ?? 'navigation failed',
    });

    let response: Response | null;
    try {
      response = await page.goto(url, { waitUntil: 'domcontentloaded' });
    } catch (err) {
      return failure(err instanceof Error ? err.message : 'navigation failed');
    }
    await page.waitForLoadState('load', { timeout: 8_000 }).catch(() => undefined);
    await page.waitForLoadState('networkidle', { timeout: 4_000 }).catch(() => undefined);
    if (!/^https?:/.test(page.url())) {
      // A script or meta refresh sent the page somewhere that failed (error page).
      return failure('net::ERR_FAILED after navigation');
    }
    state.navigated = true;

    const finalUrl = page.url();
    const finalHost = hostOf(finalUrl);
    const title = (await page.title().catch(() => '')).slice(0, CAPTURE_LIMITS.maxTitleChars);
    const text = (await page.locator('body').innerText({ timeout: 5_000 }).catch(() => ''))
      .replace(/\n{3,}/g, '\n\n')
      .slice(0, CAPTURE_LIMITS.maxTextChars);
    const screenshot = await viewportScreenshot(page);
    if (!screenshot) {
      return { status: 'failed', capturedAt: startedAt, reason: 'screenshot failed' };
    }
    const certificateIssuedAt = await certificateDate(response);
    const forms = await readForms(page, finalHost);
    const images = await elementImages(page);
    const favicon = await faviconImage(page, finalUrl);
    if (favicon) images.unshift(favicon);

    return {
      status: 'captured',
      capturedAt: startedAt,
      page: {
        finalUrl,
        title,
        text,
        screenshot,
        images: images.slice(0, CAPTURE_LIMITS.maxImages),
        forms,
        certificateIssuedAt,
      },
    };
  }
}

async function viewportScreenshot(page: Page): Promise<Buffer | null> {
  for (const quality of [70, 55, 40, 25]) {
    const shot = await page
      .screenshot({ type: 'jpeg', quality, timeout: 10_000, animations: 'disabled', caret: 'hide' })
      .catch(() => null);
    if (!shot) return null;
    if (shot.length <= CAPTURE_LIMITS.maxScreenshotBytes) return shot;
  }
  return null;
}

async function certificateDate(response: Response | null): Promise<string | null> {
  const details = await response?.securityDetails().catch(() => null);
  const validFrom = details?.validFrom;
  if (typeof validFrom !== 'number' || !Number.isFinite(validFrom) || validFrom <= 0) return null;
  const date = new Date(validFrom * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function readForms(page: Page, pageHost: string): Promise<CapturedForms> {
  const forms: CapturedForms = {
    hasPasswordField: false,
    hasPaymentField: false,
    submitsToOtherDomain: false,
  };
  const pageSite = siteOf(pageHost);
  for (const frame of page.frames().slice(0, 10)) {
    const found = await withTimeout(
      frame.evaluate<{ password: boolean; payment: boolean; actions: string[] }>(FORMS_SCRIPT),
      3_000,
      null,
    );
    if (!found) continue;
    forms.hasPasswordField ||= found.password === true;
    forms.hasPaymentField ||= found.payment === true;
    for (const action of Array.isArray(found.actions) ? found.actions : []) {
      if (!/^https?:/i.test(String(action))) continue;
      const actionHost = hostOf(String(action));
      if (actionHost && siteOf(actionHost) !== pageSite) forms.submitsToOtherDomain = true;
    }
  }
  return forms;
}

async function elementImages(page: Page): Promise<CapturedImage[]> {
  const images: CapturedImage[] = [];
  const list = await page.evaluateHandle(PICK_IMAGES_SCRIPT).catch(() => null);
  if (!list) return images;
  try {
    const entries = [...(await list.getProperties()).values()];
    for (const entry of entries) {
      if (images.length >= CAPTURE_LIMITS.maxImages - 1) break; // keep a slot for the favicon
      const kind = (await entry.getProperty('kind').then((h) => h.jsonValue())) as unknown;
      const element = (await entry.getProperty('el')).asElement() as ElementHandle | null;
      if (!element) continue;
      const png = await element
        .screenshot({ type: 'png', timeout: 3_000, animations: 'disabled' })
        .catch(() => null);
      if (png && png.length > 0 && png.length <= CAPTURE_LIMITS.maxImageBytes) {
        images.push({ kind: kind === 'logo' ? 'logo' : 'image', data: png });
      }
    }
  } finally {
    await list.dispose().catch(() => undefined);
  }
  return images;
}

/** Opens the page's favicon (through the same proxy) and screenshots it as PNG. */
async function faviconImage(page: Page, finalUrl: string): Promise<CapturedImage | null> {
  const declared = await page.evaluate<string | null>(FAVICON_SCRIPT).catch(() => null);
  let href: string;
  try {
    href = new URL(declared ?? '/favicon.ico', finalUrl).href;
  } catch {
    return null;
  }
  if (!checkTargetUrl(href).ok) return null;
  const response = await page
    .goto(href, { waitUntil: 'load', timeout: 5_000 })
    .catch(() => null);
  if (!response?.ok()) return null;
  const contentType = await page.evaluate<string>('document.contentType').catch(() => '');
  if (!contentType.startsWith('image/') || contentType.includes('svg')) return null;
  const png = await page
    .locator('img')
    .first()
    .screenshot({ type: 'png', timeout: 3_000 })
    .catch(() => null);
  if (!png || png.length > CAPTURE_LIMITS.maxImageBytes) return null;
  const kind: CapturedImageKind = 'favicon';
  return { kind, data: png };
}
