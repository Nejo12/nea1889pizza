import { z } from 'zod';

// Owner supplied last arrivals. 60–75 min interpreted as a 75-minute maximum.
export const maxTableMinutes = 75;
export function tableEndTime(start: string) {
  const minutes = Number(start.slice(0,2))*60+Number(start.slice(3))+maxTableMinutes;
  return String(Math.floor(minutes/60)%24).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
}
export function openingHours(date: string) {
  const saturday = new Date(date + 'T12:00:00Z').getUTCDay() === 6;
  return { open: saturday ? '15:30' : '11:30', close: saturday ? '22:00' : '21:30', lastArrival: saturday ? '21:30' : '21:00' };
}
export function slotsForDate(date: string) {
  if (!isRealDate(date)) return [];
  const {open,lastArrival}=openingHours(date);
  const minutes=(v:string)=>Number(v.slice(0,2))*60+Number(v.slice(3));
  const result:string[]=[];
  // Last arrivals are independent of closing hours; do not shorten the final booking.
  for(let m=minutes(open);m<=minutes(lastArrival);m+=30) result.push(String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'));
  return result;
}
// Only tables actually visible in the owner's screenshots. Flatpay live statuses are not imported.
export const restaurantTables = [
  ...Array.from({length:13},(_,i)=>({name:`Tisch ${i+1}`,area:'Innenbereich',seats:i<2?4:2})),
  ...[4,4,4,2,4,4,2].map((seats,i)=>({name:`Terrasse ${i+1}`,area:'Terrasse',seats})),
];
export function berlinClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
  const get = (key: string) => parts.find(p => p.type === key)!.value;
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}
export function isRealDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
}
export function isFutureSlot(date: string, time: string, now = new Date()) {
  const clock = berlinClock(now);
  return isRealDate(date) && slotsForDate(date).includes(time) && (date > clock.date || (date === clock.date && time > clock.time));
}
export function reservationSchema(now = new Date()) {
  return z.object({
    requestId: z.string().uuid(),
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().min(5).max(40).refine(p => /^[+\d\s()./-]+$/.test(p) && p.replace(/\D/g,'').length >= 5),
    date: z.string().refine(isRealDate),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    guests: z.number().int().min(1).max(12),
    notes: z.string().trim().max(1000),
  }).refine(r => isFutureSlot(r.date,r.time,now), {message:'Bitte einen zukünftigen Termin wählen.',path:['time']});
}
export const blockSchema = z.object({action:z.enum(['block','unblock']),date:z.string().refine(isRealDate)});
export const statusSchema = z.object({id:z.string().uuid(),status:z.enum(['pending','confirmed','arrived','cancelled','noshow'])});
export function confirmedParty<T extends {status:string}>(rows:T[]) {return rows.filter(r => r.status === 'confirmed' || r.status === 'arrived');}
// Structured booking API errors: a stable `code` for localization plus the German text kept for compatibility.
export const BOOKING_ERRORS = {
  not_found: {status: 404, message: 'Reservierung nicht gefunden. Bitte den vollständigen persönlichen Link öffnen.'},
  unavailable: {status: 503, message: 'Status gerade nicht verfügbar. Bitte erneut versuchen.'},
  too_large: {status: 413, message: 'Anfrage zu groß.'},
  invalid_request: {status: 400, message: 'Ungültige Anfrage.'},
  reopen_form: {status: 400, message: 'Bitte Formular neu öffnen.'},
  invalid_details: {status: 400, message: 'Bitte Angaben, Datenschutzhinweis und einen zukünftigen Termin prüfen.'},
  too_many_pending: {status: 429, message: 'Mehrere offene Anfragen vorhanden. Bitte das Restaurant direkt kontaktieren.'},
  day_closed: {status: 409, message: 'An diesem Tag werden keine neuen Anfragen angenommen.'},
  save_failed: {status: 503, message: 'Speicherung nicht bestätigt. Bitte erneut versuchen; dieselbe Anfrage wird nicht doppelt angelegt.'},
  cannot_modify: {status: 409, message: 'Bitte das Restaurant direkt kontaktieren, um diese Reservierung zu ändern.'},
  cancel_failed: {status: 503, message: 'Stornierung nicht bestätigt. Bitte erneut laden.'},
} as const;
export type BookingErrorCode = keyof typeof BOOKING_ERRORS;
