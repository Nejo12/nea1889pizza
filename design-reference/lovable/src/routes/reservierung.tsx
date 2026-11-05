import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format, startOfDay } from "date-fns";
import { z } from "zod";
import { DATE_LOCALES, useI18n } from "@/lib/i18n";
import type { Key } from "@/lib/i18n-dict";
import { SiteLayout, Sticker } from "@/components/site/SiteChrome";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CLOSED_WEEKDAYS, MAX_ONLINE_GUESTS, SHIFTS, TABLE_DURATION_MIN, endTime, icsFor, loadBlocked,
  loadReservations, makeToken, saveReservations, slotState, slotsForShift,
  type Reservation, type Shift, type SlotState,
} from "@/lib/reservations";

export const Route = createFileRoute("/reservierung")({
  head: () => ({
    meta: [
      { title: "Tisch reservieren – NEA 1889 Berlin" },
      { name: "description", content: "Reserviere in fünf Schritten deinen Tisch bei NEA 1889 in Berlin-Kreuzberg." },
      { property: "og:title", content: "Reservierung – NEA 1889" },
      { property: "og:description", content: "Pranzo oder Cena: in wenigen Klicks zum Tisch." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReservationPage,
});

const STEPS: Key[] = ["s.guests", "s.date", "s.time", "s.details", "s.confirm"];

const makeGuestSchema = (t: (k: Key) => string) => z.object({
  name: z.string().trim().min(2, t("e.name")).max(100),
  email: z.string().trim().email(t("e.email")).max(255),
  phone: z.string().trim().regex(/^[+0-9 ()/-]{6,30}$/, t("e.phone")),
  notes: z.string().trim().max(500, t("e.notes")),
  consent: z.literal(true, { errorMap: () => ({ message: t("e.consent") }) }),
});

const stateStyle: Record<SlotState, string> = {
  available: "bg-card hover:bg-ochre hover:text-soot",
  few: "bg-ochre/60 hover:bg-ochre",
  full: "bg-muted text-muted-foreground line-through cursor-not-allowed",
  past: "bg-muted text-muted-foreground cursor-not-allowed opacity-60",
};
const stateLabel: Record<SlotState, Key> = {
  available: "st.available", few: "st.few", full: "st.full", past: "st.past",
};

function ReservationPage() {
  const { lang, t } = useI18n();
  const de = DATE_LOCALES[lang];
  const [step, setStep] = useState(0);
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState<Date>();
  const [shift, setShift] = useState<Shift>("cena");
  const [time, setTime] = useState<string>();
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "", website: "", consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Reservation>();
  const [list, setList] = useState<Reservation[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);

  useEffect(() => {
    setList(loadReservations());
    setBlocked(loadBlocked());
  }, []);

  const dateKey = date ? format(date, "yyyy-MM-dd") : "";
  const slots = useMemo(
    () => slotsForShift(shift).map((t) => ({ t, s: slotState(list, dateKey, t, guests) })),
    [shift, list, dateKey, guests],
  );

  const submit = () => {
    if (form.website) return; // honeypot
    const parsed = makeGuestSchema(t).safeParse(form);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (e[String(i.path[0])] = i.message));
      setErrors(e);
      return;
    }
    if (!time || slotState(list, dateKey, time, guests) !== "available" && slotState(list, dateKey, time, guests) !== "few") {
      setErrors({ form: t("e.slot") });
      return;
    }
    const r: Reservation = {
      id: crypto.randomUUID(), token: makeToken(), date: dateKey, time, shift, guests,
      name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone, notes: parsed.data.notes,
      status: "pending", createdAt: new Date().toISOString(),
    };
    const next = [...list, r];
    saveReservations(next);
    setList(next);
    setDone(r);
    setStep(4);
  };

  const downloadIcs = () => {
    if (!done) return;
    const url = URL.createObjectURL(new Blob([icsFor(done)], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `NEA1889-${done.token}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const field = "w-full border border-ochre/60 bg-card px-3 py-3 text-base";

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-12">
        <p className="font-serif-it text-xl text-ochre">Prenota il tuo tavolo</p>
        <h1 className="font-display text-[clamp(2.2rem,9vw,6rem)] break-words text-plaster">{t("r.title")}</h1>
        <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
          {t("r.demo")}
        </p>

        <ol className="mt-8 grid grid-cols-5 gap-1" aria-label={t("r.progress")}>
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i === step ? "step" : undefined}
              className={`border border-ochre/60 py-2 text-center font-display text-[10px] sm:text-base ${i < step ? "bg-gulf text-plaster" : i === step ? "bg-blood text-plaster" : "bg-card"}`}>
              <span className="sm:hidden" aria-label={t(s)}>{i + 1}</span><span className="hidden sm:inline">{i + 1}. {t(s)}</span>
            </li>
          ))}
        </ol>

        <div className="poster-shadow mt-6 border border-ochre/60 bg-card p-6 sm:p-8">
          {step === 0 && (
            <div>
              <h2 className="font-display text-4xl">Quanti siete?</h2>
              <p className="font-serif-it text-muted-foreground">{t("r.howMany")}</p>
              <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {Array.from({ length: MAX_ONLINE_GUESTS }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" onClick={() => setGuests(n)} aria-pressed={guests === n}
                    className={`min-h-12 border border-ochre/60 font-display text-2xl ${guests === n ? "bg-blood text-plaster" : "bg-card hover:bg-ochre hover:text-soot"}`}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm">
                {t("r.group1", { n: MAX_ONLINE_GUESTS })}{" "}
                <a href="tel:+493098465557" className="font-semibold text-ochre underline underline-offset-4">030 984 655 57</a>{" "}
                {t("r.group2")}
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-display text-4xl">Quando?</h2>
              <p className="font-serif-it text-muted-foreground">{t("r.whenSub")}</p>
              <div className="mt-4 inline-flex border border-ochre/60" role="group" aria-label={t("r.shift")}>
                {(Object.keys(SHIFTS) as Shift[]).map((s) => (
                  <button key={s} type="button" aria-pressed={shift === s} onClick={() => { setShift(s); setTime(undefined); }}
                    className={`px-6 py-2 font-display text-xl ${shift === s ? "bg-gulf text-plaster" : "bg-card"}`}>
                    {SHIFTS[s].label} <span className="font-sans text-xs">{SHIFTS[s].open}–{SHIFTS[s].close}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 inline-block border border-ochre/60 bg-card">
                <Calendar
                  mode="single" locale={de} weekStartsOn={1} selected={date}
                  onSelect={(d) => { setDate(d); setTime(undefined); }}
                  disabled={(d) =>
                    d < startOfDay(new Date()) ||
                    CLOSED_WEEKDAYS.includes(d.getDay()) ||
                    blocked.includes(format(d, "yyyy-MM-dd"))
                  }
                  className="p-3 pointer-events-auto"
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t("r.mondays")}</p>
            </div>
          )}

          {step === 2 && date && (
            <div>
              <h2 className="font-display text-4xl">A che ora?</h2>
              <p className="font-serif-it text-muted-foreground">
                {format(date, "EEEE, d MMMM", { locale: de })} · {SHIFTS[shift].label} · {t("r.timeSub", { n: TABLE_DURATION_MIN })}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {slots.map(({ t: slot, s }) => {
                  const disabled = s === "full" || s === "past";
                  return (
                    <button key={slot} type="button" disabled={disabled} onClick={() => setTime(slot)} aria-pressed={time === slot}
                      className={`border border-ochre/60 px-2 py-3 text-left ${time === slot ? "bg-blood text-plaster" : stateStyle[s]}`}>
                      <span className="block font-display text-2xl">{slot}</span>
                      <span className="block text-xs">{t("r.until")} {endTime(slot)} · {t(stateLabel[s])}</span>
                    </button>
                  );
                })}
              </div>
              {slots.every((x) => x.s === "full" || x.s === "past") && (
                <p className="mt-4 font-semibold text-destructive">{t("r.noSlots")}</p>
              )}
            </div>
          )}

          {step === 3 && (
            <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
              <h2 className="font-display text-4xl">I tuoi dati</h2>
              <p className="font-serif-it -mt-3 text-muted-foreground">{t("r.detailsSub")}</p>
              {(["name", "email", "phone"] as const).map((k) => (
                <div key={k}>
                  <label htmlFor={k} className="font-display text-lg">
                    {t(k === "name" ? "f.name" : k === "email" ? "f.email" : "f.phone")} *
                  </label>
                  <input id={k} type={k === "email" ? "email" : k === "phone" ? "tel" : "text"}
                    autoComplete={k === "phone" ? "tel" : k} value={form[k]} aria-invalid={!!errors[k]}
                    aria-describedby={errors[k] ? `${k}-err` : undefined}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={field} maxLength={255} />
                  {errors[k] && <p id={`${k}-err`} className="mt-1 text-sm font-semibold text-destructive">{errors[k]}</p>}
                </div>
              ))}
              <div>
                <label htmlFor="notes" className="font-display text-lg">{t("f.notes")}</label>
                <textarea id="notes" rows={3} maxLength={500} value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} className={field} />
              </div>
              <div aria-hidden="true" className="absolute -left-[9999px]">
                <label htmlFor="website">Website</label>
                <input id="website" tabIndex={-1} autoComplete="off" value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="consent" checked={form.consent} className="mt-1 size-5 border border-ochre/60"
                  onCheckedChange={(v) => setForm({ ...form, consent: v === true })} aria-invalid={!!errors["consent"]} />
                <label htmlFor="consent" className="text-sm">
                  {t("f.consent")}{" "}
                  <Link to="/datenschutz" className="underline">{t("f.consentLink")}</Link>. *
                </label>
              </div>
              {errors["consent"] && <p className="text-sm font-semibold text-destructive">{errors["consent"]}</p>}
              {errors["form"] && <p className="text-sm font-semibold text-destructive">{errors["form"]}</p>}
              <button type="submit" className="poster-shadow w-full border border-ochre/60 bg-blood px-6 py-4 font-display text-2xl text-plaster">
                {t("f.submit")}
              </button>
            </form>
          )}

          {step === 4 && done && (
            <div className="text-center">
              <Sticker tone="ochre" className="rotate-[-4deg] text-2xl">Grazie, {done.name.split(" ")[0]}!</Sticker>
              <h2 className="font-display mt-6 text-5xl text-ochre">Tavolo richiesto</h2>
              <p className="mt-2">{t("c.number")}</p>
              <p className="font-display mt-1 text-5xl tracking-widest text-ochre">{done.token}</p>
              <dl className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-2 text-left">
                <dt className="text-muted-foreground">{t("c.date")}</dt>
                <dd className="font-semibold">{format(new Date(done.date), "EEE, d MMM yyyy", { locale: de })}</dd>
                <dt className="text-muted-foreground">{t("c.time")}</dt>
                <dd className="font-semibold">{done.time} – {endTime(done.time)}</dd>
                <dt className="text-muted-foreground">{t("c.guests")}</dt>
                <dd className="font-semibold">{done.guests}</dd>
              </dl>
              <button type="button" onClick={downloadIcs} className="poster-shadow mt-8 border border-ochre/60 bg-gulf px-6 py-3 font-display text-xl text-plaster">
                {t("c.ics")}
              </button>
              <p className="mt-4 text-xs text-muted-foreground">{t("c.noMail")}</p>
            </div>
          )}

          {step < 4 && (
            <div className="mt-8 flex justify-between gap-4">
              <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}
                className="border border-ochre/60 px-4 py-2 font-display text-base whitespace-nowrap sm:px-5 sm:text-xl disabled:opacity-40">← {t("back")}</button>
              {step < 3 && (
                <button type="button"
                  disabled={(step === 1 && !date) || (step === 2 && !time)}
                  onClick={() => setStep(step + 1)}
                  className="border border-ochre/60 bg-ochre px-4 py-2 font-display text-base whitespace-nowrap text-soot sm:px-5 sm:text-xl disabled:opacity-40">
                  {t("next")} →
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}