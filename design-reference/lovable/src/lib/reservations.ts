// DEMO reservation engine. Persistence is browser localStorage only —
// no real backend is connected (pending Founder approval).
export type Shift = "pranzo" | "cena";
export type ReservationStatus = "pending" | "confirmed" | "seated" | "cancelled";

export interface Reservation {
  id: string;
  token: string;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  shift: Shift;
  guests: number;
  name: string;
  email: string;
  phone: string;
  notes: string;
  status: ReservationStatus;
  createdAt: string;
}

export const MAX_ONLINE_GUESTS = 12;
export const TABLE_DURATION_MIN = 75;
export const SLOT_INTERVAL_MIN = 30;
export const SEAT_CAPACITY = 40;

// OPEN DECISION: real opening hours to be confirmed by the owner.
export const SHIFTS: Record<Shift, { label: string; open: string; close: string }> = {
  pranzo: { label: "Pranzo", open: "12:00", close: "15:00" },
  cena: { label: "Cena", open: "17:30", close: "22:30" },
};
export const CLOSED_WEEKDAYS = [1]; // Monday = Ruhetag

export const toMin = (t: string) => {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return h * 60 + m;
};
export const fromMin = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function endTime(time: string) {
  return fromMin(toMin(time) + TABLE_DURATION_MIN);
}

/** Slots every 30 min; last seating must finish (75 min) before close. */
export function slotsForShift(shift: Shift): string[] {
  const { open, close } = SHIFTS[shift];
  const out: string[] = [];
  for (let t = toMin(open); t + TABLE_DURATION_MIN <= toMin(close); t += SLOT_INTERVAL_MIN) {
    out.push(fromMin(t));
  }
  return out;
}

export type SlotState = "available" | "few" | "full" | "past";

export function seatsTaken(list: Reservation[], date: string, time: string) {
  const s = toMin(time);
  return list
    .filter((r) => r.date === date && r.status !== "cancelled")
    .filter((r) => {
      const rs = toMin(r.time);
      return rs < s + TABLE_DURATION_MIN && rs + TABLE_DURATION_MIN > s;
    })
    .reduce((n, r) => n + r.guests, 0);
}

export function slotState(
  list: Reservation[],
  date: string,
  time: string,
  guests: number,
  now: Date = new Date(),
): SlotState {
  const [y = 0, mo = 1, d = 1] = date.split("-").map(Number);
  const mins = toMin(time);
  const slot = new Date(y, mo - 1, d, Math.floor(mins / 60), mins % 60);
  if (slot.getTime() <= now.getTime()) return "past";
  const free = SEAT_CAPACITY - seatsTaken(list, date, time);
  if (free < guests) return "full";
  if (free - guests < 8) return "few";
  return "available";
}

export function makeToken(rand: () => number = Math.random) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += abc[Math.floor(rand() * abc.length)];
  return `NEA-${s}`;
}

const KEY = "nea1889.demo.reservations";
const BLOCK_KEY = "nea1889.demo.blocked";

export function loadReservations(): Reservation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
export function saveReservations(list: Reservation[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}
export function loadBlocked(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(BLOCK_KEY) || "[]");
  } catch {
    return [];
  }
}
export function saveBlocked(list: string[]) {
  localStorage.setItem(BLOCK_KEY, JSON.stringify(list));
}

export function icsFor(r: Reservation) {
  const stamp = (date: string, time: string) => `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NEA 1889//Reservierung//DE",
    "BEGIN:VEVENT",
    `UID:${r.token}@nea1889`,
    `DTSTART;TZID=Europe/Berlin:${stamp(r.date, r.time)}`,
    `DTEND;TZID=Europe/Berlin:${stamp(r.date, endTime(r.time))}`,
    `SUMMARY:NEA 1889 – Tisch für ${r.guests}`,
    "LOCATION:Zimmerstraße 26/27\\, 10969 Berlin",
    `DESCRIPTION:Reservierung ${r.token}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}