import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { de } from "date-fns/locale";
import {
  SHIFTS, endTime, loadBlocked, loadReservations, saveBlocked, saveReservations,
  type Reservation, type ReservationStatus, type Shift,
} from "@/lib/reservations";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff Portal – NEA 1889" },
      { name: "description", content: "Interner Bereich für das NEA 1889 Team." },
      { property: "og:title", content: "Staff Portal – NEA 1889" },
      { property: "og:description", content: "Reservierungsverwaltung für das Team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: StaffPage,
});

const statusStyle: Record<ReservationStatus, string> = {
  pending: "bg-ochre text-soot",
  confirmed: "bg-gulf text-plaster",
  seated: "bg-chart-4 text-soot",
  cancelled: "bg-muted text-muted-foreground line-through",
};
const statusLabel: Record<ReservationStatus, string> = {
  pending: "Offen", confirmed: "Bestätigt", seated: "Platziert", cancelled: "Storniert",
};

function StaffPage() {
  const [authed, setAuthed] = useState(false);
  return (
    <div className="dark min-h-screen bg-background font-sans text-foreground">
      <div className="bg-blood py-1.5 text-center text-xs tracking-[0.25em] text-plaster uppercase">
        Demo-Portal · kein echter Login · Daten nur in diesem Browser
      </div>
      {authed ? <Dashboard onLogout={() => setAuthed(false)} /> : <Login onLogin={() => setAuthed(true)} />}
    </div>
  );
}

function Login({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="flex min-h-[90vh] items-center justify-center px-4">
      <form onSubmit={(e) => { e.preventDefault(); onLogin(); }} className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-8">
        <p className="font-display text-4xl text-ochre">NEA 1889</p>
        <h1 className="text-xl font-semibold">Staff Login</h1>
        <div>
          <label htmlFor="email" className="text-sm text-muted-foreground">E-Mail</label>
          <input id="email" type="email" autoComplete="username" className="mt-1 w-full rounded-md border bg-background px-3 py-2" />
        </div>
        <div>
          <label htmlFor="pw" className="text-sm text-muted-foreground">Passwort</label>
          <input id="pw" type="password" autoComplete="current-password" className="mt-1 w-full rounded-md border bg-background px-3 py-2" />
        </div>
        <button type="submit" className="w-full rounded-md bg-primary py-2.5 font-semibold text-primary-foreground hover:opacity-90">
          Anmelden (Demo)
        </button>
        <p className="text-xs text-muted-foreground">Prototyp: jede Eingabe öffnet das Dashboard. Echte Anmeldung erfordert ein freigegebenes Backend.</p>
        <Link to="/" className="block text-center text-sm text-muted-foreground underline">Zur Website</Link>
      </form>
    </main>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [list, setList] = useState<Reservation[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [day, setDay] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [shift, setShift] = useState<Shift | "all">("all");

  useEffect(() => { setList(loadReservations()); setBlocked(loadBlocked()); }, []);

  const rows = useMemo(
    () => list.filter((r) => r.date === day && (shift === "all" || r.shift === shift)).sort((a, b) => a.time.localeCompare(b.time)),
    [list, day, shift],
  );
  const covers = rows.filter((r) => r.status !== "cancelled").reduce((n, r) => n + r.guests, 0);

  const setStatus = (id: string, status: ReservationStatus) => {
    const next = list.map((r) => (r.id === id ? { ...r, status } : r));
    setList(next); saveReservations(next);
  };
  const toggleBlock = (d: string) => {
    const next = blocked.includes(d) ? blocked.filter((x) => x !== d) : [...blocked, d];
    setBlocked(next); saveBlocked(next);
  };
  const days = Array.from({ length: 14 }, (_, i) => format(addDays(new Date(), i), "yyyy-MM-dd"));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-3xl text-ochre">NEA 1889 · Sala</p>
          <h1 className="text-2xl font-semibold">Reservierungen</h1>
        </div>
        <button onClick={onLogout} className="rounded-md border px-4 py-2 text-sm hover:bg-secondary">Abmelden</button>
      </header>

      <section className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="day" className="text-sm text-muted-foreground">Datum</label>
          <input id="day" type="date" value={day} onChange={(e) => setDay(e.target.value)} className="mt-1 block rounded-md border bg-card px-3 py-2" />
        </div>
        <div role="group" aria-label="Schicht" className="flex overflow-hidden rounded-md border">
          {(["all", "pranzo", "cena"] as const).map((s) => (
            <button key={s} onClick={() => setShift(s)} aria-pressed={shift === s}
              className={`px-4 py-2 text-sm ${shift === s ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary"}`}>
              {s === "all" ? "Alle" : SHIFTS[s].label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-3">
          <Stat label="Reservierungen" value={rows.length} />
          <Stat label="Gedecke" value={covers} />
        </div>
      </section>

      {blocked.includes(day) && (
        <p className="mt-4 rounded-md border border-destructive bg-destructive/15 p-3 text-sm">Dieser Tag ist für Online-Buchungen gesperrt.</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr><th className="p-3">Zeit</th><th className="p-3">Gast</th><th className="p-3">Pers.</th><th className="p-3">Hinweise</th><th className="p-3">Status</th><th className="p-3 text-right">Aktion</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Keine Reservierungen für diese Auswahl. Lege über die Reservierungsseite eine Test-Buchung an.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="p-3 font-semibold">{r.time}<span className="block text-xs text-muted-foreground">bis {endTime(r.time)}</span></td>
                <td className="p-3">{r.name}<span className="block text-xs text-muted-foreground">{r.token} · {r.phone}</span></td>
                <td className="p-3">{r.guests}</td>
                <td className="max-w-48 p-3 text-xs">{r.notes || "–"}</td>
                <td className="p-3"><span className={`rounded px-2 py-1 text-xs font-semibold ${statusStyle[r.status]}`}>{statusLabel[r.status]}</span></td>
                <td className="space-x-2 p-3 text-right whitespace-nowrap">
                  {r.status === "pending" && <Act onClick={() => setStatus(r.id, "confirmed")}>Bestätigen</Act>}
                  {r.status === "confirmed" && <Act onClick={() => setStatus(r.id, "seated")}>Platzieren</Act>}
                  {r.status !== "cancelled" && r.status !== "seated" && <Act onClick={() => setStatus(r.id, "cancelled")} muted>Stornieren</Act>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Gesperrte Tage (nächste 14 Tage)</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {days.map((d) => {
            const on = blocked.includes(d);
            return (
              <button key={d} onClick={() => toggleBlock(d)} aria-pressed={on}
                className={`rounded-md border p-3 text-left text-sm ${on ? "border-destructive bg-destructive/20" : "bg-card hover:bg-secondary"}`}>
                <span className="block font-semibold">{format(new Date(d), "EEE d.MM.", { locale: de })}</span>
                <span className="text-xs text-muted-foreground">{on ? "Gesperrt" : "Offen"}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-card px-4 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
function Act({ children, onClick, muted }: { children: React.ReactNode; onClick: () => void; muted?: boolean }) {
  return (
    <button onClick={onClick} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${muted ? "border hover:bg-secondary" : "bg-accent text-accent-foreground hover:opacity-90"}`}>
      {children}
    </button>
  );
}