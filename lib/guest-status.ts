// Browser-side helpers for the guest status page. The API keeps returning the German `error` text for
// compatibility and adds a stable `code` (table in reservation-rules.ts); the browser localizes by code.
import {BOOKING_ERRORS,type BookingErrorCode} from './reservation-rules';
export {BOOKING_ERRORS,type BookingErrorCode};
// Messages emitted by earlier versions of the API (no `code` field).
const legacyMessages: Record<string, BookingErrorCode> = {'Reservierung nicht gefunden.': 'not_found'};

export function codeFromMessage(message: unknown): BookingErrorCode | undefined {
  if (typeof message !== 'string') return undefined;
  if (message in legacyMessages) return legacyMessages[message];
  return (Object.keys(BOOKING_ERRORS) as BookingErrorCode[]).find(c => BOOKING_ERRORS[c].message === message);
}

/** Translation key for an API error body; falls back to a generic message. */
export function errorKey(body: {code?: unknown; error?: unknown}) {
  const code = typeof body.code === 'string' && body.code in BOOKING_ERRORS ? (body.code as BookingErrorCode) : codeFromMessage(body.error);
  return code ? (`err.${code}` as const) : ('err.generic' as const);
}

const statusKeys = {
  pending: 'rs.status.pending', confirmed: 'rs.status.confirmed', arrived: 'rs.status.arrived',
  cancelled: 'rs.status.cancelled', noshow: 'rs.status.noshow',
} as const;
export function statusKey(status: string) {
  return Object.hasOwn(statusKeys, status) ? statusKeys[status as keyof typeof statusKeys] : ('rs.status.unknown' as const);
}

/** The personal token is 256 bits of lowercase hex, carried in the URL fragment so it never reaches a server log. */
export function tokenFromHash(hash: string) {
  const value = hash.startsWith('#') ? hash.slice(1) : hash;
  return /^[a-f0-9]{64}$/.test(value) ? value : null;
}
