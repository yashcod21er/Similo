import { lookup } from 'node:dns/promises';
import {
  createServer,
  request as httpRequest,
  type IncomingHttpHeaders,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { connect, isIP, type AddressInfo, type Socket } from 'node:net';
import type { Duplex } from 'node:stream';
import { isBlockedAddress } from './ip-policy.js';
import { checkHostPort, checkTargetUrl } from './url-policy.js';

/**
 * The SSRF guard: a tiny HTTP + CONNECT proxy that the capture browser must use
 * for every request (Chromium runs with --proxy-server pointing here and
 * --proxy-bypass-list=<-loopback>, so not even loopback is bypassed).
 *
 * For each request the proxy itself resolves the host name, refuses it when ANY
 * resolved address is private or reserved, and then connects to that exact
 * checked address. The browser never resolves names itself, so DNS rebinding
 * (a name that answers "public" to the check and "private" to the connect) and
 * redirects to internal hosts are both caught here: every hop is a new proxy
 * request that is checked again.
 *
 * It also enforces per-capture limits (total bytes and number of requests) and
 * refuses WebSocket upgrades and any port other than 80/443.
 */

/** Returns every address a host name resolves to. */
export type Resolver = (hostname: string) => Promise<string[]>;
/** Opens a TCP connection to an already-checked IP address. */
export type Dialer = (address: string, port: number) => Socket;

export interface GuardProxyOptions {
  resolve?: Resolver;
  dial?: Dialer;
  /** Total bytes (both directions) allowed through the proxy. */
  maxBytes?: number;
  /** Plain requests plus CONNECT tunnels allowed. */
  maxRequests?: number;
  /** How long an upstream connection may stay silent. */
  idleTimeoutMs?: number;
  /** How long one connection attempt may take. */
  connectTimeoutMs?: number;
}

export type GuardOutcome = 'blocked' | 'dns_failed' | 'connect_failed' | 'limit';

export interface GuardEvent {
  host: string;
  outcome: GuardOutcome;
  /** Short technical reason for logs; never shown to users. */
  reason: string;
}

export type ResolvedTarget =
  | { ok: true; addresses: string[] }
  | { ok: false; outcome: Exclude<GuardOutcome, 'connect_failed' | 'limit'>; reason: string };

export interface GuardProxy {
  /** `http://127.0.0.1:<port>` for Chromium's --proxy-server. */
  readonly url: string;
  readonly port: number;
  /** Every refusal or failure, in order (for working out why a page failed). */
  readonly events: readonly GuardEvent[];
  stats(): { requests: number; bytes: number };
  /** Resolve + check a host the same way proxied requests are checked. */
  resolveTarget(host: string, port: number): Promise<ResolvedTarget>;
  close(): Promise<void>;
}

export const GUARD_DEFAULTS = {
  maxBytes: 25 * 1024 * 1024,
  maxRequests: 150,
  idleTimeoutMs: 15_000,
  connectTimeoutMs: 6_000,
} as const;

export const systemResolver: Resolver = async (hostname) => {
  const results = await lookup(hostname, { all: true, verbatim: true });
  return results.map((result) => result.address);
};

export const directDialer: Dialer = (address, port) => connect({ host: address, port });

/** Headers that belong to one connection hop and must not be forwarded. */
const HOP_BY_HOP = new Set([
  'connection',
  'proxy-connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function hostOfUrl(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^\[|\]$/g, '').toLowerCase();
  } catch {
    return '';
  }
}

function forwardableHeaders(headers: IncomingHttpHeaders): IncomingHttpHeaders {
  const named = String(headers.connection ?? '')
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
  const result: IncomingHttpHeaders = {};
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined || HOP_BY_HOP.has(name) || named.includes(name)) continue;
    result[name] = value;
  }
  return result;
}

export async function startGuardProxy(options: GuardProxyOptions = {}): Promise<GuardProxy> {
  const resolve = options.resolve ?? systemResolver;
  const dial = options.dial ?? directDialer;
  const maxBytes = options.maxBytes ?? GUARD_DEFAULTS.maxBytes;
  const maxRequests = options.maxRequests ?? GUARD_DEFAULTS.maxRequests;
  const idleTimeoutMs = options.idleTimeoutMs ?? GUARD_DEFAULTS.idleTimeoutMs;
  const connectTimeoutMs = options.connectTimeoutMs ?? GUARD_DEFAULTS.connectTimeoutMs;

  const events: GuardEvent[] = [];
  const sockets = new Set<Duplex>();
  let requests = 0;
  let bytes = 0;
  let closed = false;

  const track = (socket: Duplex) => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
  };

  /** Adds transferred bytes; returns false once the capture has used its budget. */
  const addBytes = (count: number, host: string): boolean => {
    bytes += count;
    if (bytes > maxBytes) {
      if (!events.some((event) => event.outcome === 'limit')) {
        events.push({ host, outcome: 'limit', reason: 'byte limit reached' });
      }
      return false;
    }
    return true;
  };

  /** Counts one request; false when the request limit or byte budget is used up. */
  const admit = (host: string): boolean => {
    requests += 1;
    if (closed || requests > maxRequests || bytes > maxBytes) {
      events.push({ host, outcome: 'limit', reason: 'request or byte limit reached' });
      return false;
    }
    return true;
  };

  async function resolveTarget(rawHost: string, port: number): Promise<ResolvedTarget> {
    const hostCheck = checkHostPort(rawHost, port);
    if (!hostCheck.ok) return { ok: false, outcome: 'blocked', reason: hostCheck.reason };
    if (hostCheck.ipLiteral) return { ok: true, addresses: [hostCheck.ipLiteral] };

    let addresses: string[];
    try {
      addresses = await resolve(hostCheck.host);
    } catch {
      return { ok: false, outcome: 'dns_failed', reason: 'name did not resolve' };
    }
    if (addresses.length === 0) {
      return { ok: false, outcome: 'dns_failed', reason: 'name did not resolve' };
    }
    // Refuse if ANY answer is private: a mixed answer is a classic rebinding trick.
    if (addresses.some((address) => isBlockedAddress(address))) {
      return { ok: false, outcome: 'blocked', reason: 'name resolves to a private address' };
    }
    // IPv4 first: on DNS64 networks the synthesised IPv6 answers may not route.
    const v4 = addresses.filter((address) => isIP(address) === 4);
    const v6 = addresses.filter((address) => isIP(address) !== 4);
    return { ok: true, addresses: [...new Set([...v4, ...v6])] };
  }

  /**
   * Resolves and checks `host`, then connects to one of the checked addresses
   * (never resolving again). Records why when it cannot; returns null then.
   */
  async function connectChecked(rawHost: string, port: number): Promise<Socket | null> {
    const host = rawHost.replace(/^\[|\]$/g, '').toLowerCase();
    const target = await resolveTarget(rawHost, port);
    if (!target.ok) {
      events.push({ host, outcome: target.outcome, reason: target.reason });
      return null;
    }
    let lastError = 'connection failed';
    for (const address of target.addresses.slice(0, 3)) {
      if (closed) return null;
      try {
        return await new Promise<Socket>((resolveSocket, rejectSocket) => {
          const socket = dial(address, port);
          track(socket);
          const fail = (err: Error) => {
            socket.destroy();
            rejectSocket(err);
          };
          socket.setTimeout(connectTimeoutMs, () => fail(new Error('connect timeout')));
          socket.once('error', fail);
          socket.once('connect', () => {
            socket.off('error', fail);
            socket.setTimeout(idleTimeoutMs);
            resolveSocket(socket);
          });
        });
      } catch (err) {
        lastError = err instanceof Error ? err.message.slice(0, 120) : lastError;
      }
    }
    events.push({ host, outcome: 'connect_failed', reason: lastError });
    return null;
  }

  /* -------------------------------------------- Plain http:// requests */
  async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const raw = req.url ?? '';
    const target = raw.startsWith('http://') ? checkTargetUrl(raw) : null;
    if (!target?.ok || target.url.protocol !== 'http:') {
      events.push({
        host: hostOfUrl(raw),
        outcome: 'blocked',
        reason: target && !target.ok ? target.reason : 'not a proxy request',
      });
      res.destroy();
      return;
    }
    const host = target.host;
    if (!admit(host)) {
      res.destroy();
      return;
    }
    const socket = await connectChecked(host, target.port);
    if (!socket) {
      // Destroying (instead of answering 403) makes Chromium report a network
      // error rather than showing our answer as if the site had sent it.
      res.destroy();
      return;
    }

    const upstream = httpRequest({
      method: req.method,
      path: `${target.url.pathname}${target.url.search}`,
      headers: { ...forwardableHeaders(req.headers), host: target.url.host },
      createConnection: () => socket,
    });
    upstream.setTimeout(idleTimeoutMs, () => upstream.destroy(new Error('upstream timeout')));
    upstream.on('error', (err) => {
      events.push({ host, outcome: 'connect_failed', reason: err.message.slice(0, 120) });
      res.destroy();
    });
    upstream.on('response', (upstreamRes) => {
      upstreamRes.on('data', (chunk: Buffer) => {
        if (!addBytes(chunk.length, host)) {
          upstreamRes.destroy();
          res.destroy();
        }
      });
      res.writeHead(upstreamRes.statusCode ?? 502, forwardableHeaders(upstreamRes.headers));
      upstreamRes.pipe(res);
    });
    req.on('data', (chunk: Buffer) => {
      if (!addBytes(chunk.length, host)) upstream.destroy();
    });
    req.pipe(upstream);
  }

  /* --------------------------------------------- CONNECT (https) tunnels */
  async function handleConnect(req: IncomingMessage, client: Socket, head: Buffer): Promise<void> {
    track(client);
    client.on('error', () => client.destroy());
    const refuse = (status: string) => {
      if (!client.destroyed) {
        client.end(`HTTP/1.1 ${status}\r\nContent-Length: 0\r\nConnection: close\r\n\r\n`);
      }
    };

    let host: string;
    let port: number;
    try {
      const parsed = new URL(`http://${req.url ?? ''}`);
      if (parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search) {
        throw new Error('bad target');
      }
      host = parsed.hostname;
      port = parsed.port ? Number(parsed.port) : 80;
    } catch {
      events.push({ host: '', outcome: 'blocked', reason: 'bad CONNECT target' });
      refuse('400 Bad Request');
      return;
    }
    const normalisedHost = host.replace(/^\[|\]$/g, '').toLowerCase();
    if (!admit(normalisedHost)) {
      refuse('403 Forbidden');
      return;
    }
    const upstream = await connectChecked(host, port);
    if (!upstream) {
      const last = events.at(-1);
      refuse(last?.outcome === 'blocked' ? '403 Forbidden' : '502 Bad Gateway');
      return;
    }
    if (client.destroyed) {
      upstream.destroy();
      return;
    }
    upstream.on('error', () => client.destroy());
    upstream.on('timeout', () => upstream.destroy());
    upstream.on('close', () => client.destroy());
    client.on('close', () => upstream.destroy());
    client.setTimeout(idleTimeoutMs, () => client.destroy());

    client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    const count = (chunk: Buffer) => {
      if (!addBytes(chunk.length, normalisedHost)) {
        client.destroy();
        upstream.destroy();
      }
    };
    if (head.length > 0) {
      count(head);
      upstream.write(head);
    }
    upstream.on('data', count);
    client.on('data', count);
    upstream.pipe(client);
    client.pipe(upstream);
  }

  const server = createServer((req, res) => {
    void handleRequest(req, res).catch(() => res.destroy());
  });
  server.on('connect', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    void handleConnect(req, socket as Socket, head).catch(() => socket.destroy());
  });
  // ws:// upgrades are never proxied (wss:// is closed in the browser itself).
  server.on('upgrade', (_req: IncomingMessage, socket: Duplex) => {
    events.push({ host: '', outcome: 'blocked', reason: 'WebSocket upgrade refused' });
    socket.destroy();
  });
  server.on('connection', (socket: Socket) => track(socket));
  server.on('clientError', (_err, socket: Duplex) => socket.destroy());

  await new Promise<void>((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', rejectListen);
      resolveListen();
    });
  });
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    port,
    events,
    stats: () => ({ requests, bytes }),
    resolveTarget,
    async close() {
      closed = true;
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((done) => server.close(() => done()));
    },
  };
}
