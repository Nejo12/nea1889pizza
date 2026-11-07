// Browser-side loader for GET /api/availability. The result is advisory only: it never reserves anything and
// the server revalidates on submit and on staff confirmation. Only the newest request may update state.
export type SlotStatus = 'available' | 'full' | 'past' | 'closed';
export type Slot = {time: string; status: SlotStatus};
export type AvailabilityState =
  | {phase: 'loading'}
  | {phase: 'ready'; slots: Slot[]}
  | {phase: 'error'; reason: 'network' | 'server' | 'invalid'};
export type DaySummary = 'open' | 'full' | 'closed' | 'past' | 'empty';

type FetchLike = (url: string, init: {signal: AbortSignal}) => Promise<{ok: boolean; json(): Promise<unknown>}>;
const STATUSES: readonly string[] = ['available', 'full', 'past', 'closed'];

function parse(body: unknown, date: string, guests: number): Slot[] | null {
  const b = body as {date?: unknown; guests?: unknown; slots?: unknown} | null;
  if (!b || b.date !== date || b.guests !== guests || !Array.isArray(b.slots)) return null;
  const slots: Slot[] = [];
  for (const s of b.slots as {time?: unknown; status?: unknown}[]) {
    if (!s || typeof s.time !== 'string' || typeof s.status !== 'string' || !STATUSES.includes(s.status)) return null;
    slots.push({time: s.time, status: s.status as SlotStatus});
  }
  return slots;
}

export function createAvailabilityLoader(onState: (s: AvailabilityState) => void, fetchImpl: FetchLike = fetch as FetchLike) {
  let current: AbortController | undefined;
  let seq = 0;
  const cancel = () => { seq++; current?.abort(); current = undefined; };
  const load = (date: string, guests: number) => {
    cancel();
    const mine = seq;
    const ctl = (current = new AbortController());
    const live = () => mine === seq && !ctl.signal.aborted;
    onState({phase: 'loading'});
    void (async () => {
      try {
        const res = await fetchImpl(`/api/availability?date=${encodeURIComponent(date)}&guests=${guests}`, {signal: ctl.signal});
        if (!res.ok) { if (live()) onState({phase: 'error', reason: 'server'}); return; }
        const slots = parse(await res.json().catch(() => null), date, guests);
        if (!live()) return;
        onState(slots ? {phase: 'ready', slots} : {phase: 'error', reason: 'invalid'});
      } catch {
        if (live()) onState({phase: 'error', reason: 'network'});
      }
    })();
  };
  return {load, cancel};
}

export function summarize(slots: Slot[]): DaySummary {
  if (!slots.length) return 'empty';
  if (slots.some(s => s.status === 'available')) return 'open';
  if (slots.every(s => s.status === 'closed')) return 'closed';
  if (slots.some(s => s.status === 'full')) return 'full';
  return 'past';
}
