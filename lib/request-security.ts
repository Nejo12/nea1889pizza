// Browser-origin and request-body safeguards for the public guest API (#13).
// Origin checking is an abuse safeguard for browsers, not guest authentication and not anti-bot protection:
// the guest API has no ambient credentials, and non-browser clients can send any headers.
import {authorizedOrigins} from './trusted-origins';

export type OriginVerdict = 'ok' | 'misconfigured' | 'forbidden';

/** Parses an entry into a strict http(s) origin; anything with a path, query, credentials or other scheme is rejected. */
function strictOrigin(value: string): string | null {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (u.username || u.password) return null;
    return u.origin;
  } catch {
    return null;
  }
}
/** An Origin header must already be in canonical origin form (no path, no trailing slash). */
const headerOrigin = (value: string) => { const o = strictOrigin(value); return o && o === value ? o : null; };

/**
 * Decides whether a state-changing request comes from a trusted site.
 * - Trusted origins are the exact, parsed values from `authorizedOrigins()` (AUTHORIZED_ORIGINS, preview URL, dev localhost).
 *   An empty or invalid configuration denies every request ("misconfigured").
 * - The request's own URL/Host and X-Forwarded-* headers are deliberately not trusted as a source of truth,
 *   because they depend on the proxy in front of the app.
 * - `Sec-Fetch-Site: cross-site` and `same-site` (sibling subdomains) are rejected.
 * - `Origin` is authoritative when present (including `null`, which is rejected); `Referer` is a fallback only
 *   when `Origin` is absent. No evidence at all is rejected.
 */
export function checkRequestOrigin(req: Request, configured: string[] = authorizedOrigins()): OriginVerdict {
  const trusted = new Set(configured.map(strictOrigin).filter((o): o is string => !!o));
  if (!trusted.size) return 'misconfigured';
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return 'forbidden';
  const origin = req.headers.get('origin');
  if (origin !== null) {
    const parsed = headerOrigin(origin);
    return parsed && trusted.has(parsed) ? 'ok' : 'forbidden';
  }
  const referer = req.headers.get('referer');
  const fromReferer = referer ? strictOrigin(referer) : null;
  return fromReferer && trusted.has(fromReferer) ? 'ok' : 'forbidden';
}

export const MAX_JSON_BYTES = 12000;
export type JsonResult = {ok: true; value: unknown} | {ok: false; reason: 'media_type' | 'too_large' | 'malformed'};

const isJson = (type: string | null) => !!type && /^application\/json\s*(;|$)/i.test(type.trim());

/** Reads a JSON body while counting the bytes actually received; stops reading once the cap is exceeded. */
export async function readJsonBody(req: Request, limit = MAX_JSON_BYTES): Promise<JsonResult> {
  if (!isJson(req.headers.get('content-type'))) return {ok: false, reason: 'media_type'};
  const declared = req.headers.get('content-length');
  if (declared !== null && Number(declared) > limit) return {ok: false, reason: 'too_large'};
  if (!req.body) return {ok: false, reason: 'malformed'};
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const {done, value} = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > limit) { await reader.cancel().catch(() => {}); return {ok: false, reason: 'too_large'}; }
    chunks.push(value);
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) { bytes.set(c, offset); offset += c.byteLength; }
  try {
    return {ok: true, value: JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes))};
  } catch {
    return {ok: false, reason: 'malformed'};
  }
}
