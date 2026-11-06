"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { DATE_LOCALES, useI18n } from "@/lib/site/i18n";
import type { Key } from "@/lib/site/i18n-dict";
import { SiteLayout, Sticker } from "@/components/site/SiteChrome";
import { Calendar } from "@/components/site/calendar";
import { secureId } from "@/lib/client-id";
import { berlinClock, isFutureSlot, maxTableMinutes, slotsForDate, tableEndTime } from "@/lib/reservation-rules";
import { icsFor } from "@/lib/site/ics";
import { errorKey } from "@/lib/guest-status";

// The booking itself is server-authoritative: this wizard only collects input and POSTs it to /api/booking.
// Slot availability shown here is advisory (opening hours and past times); the server revalidates everything.
const MAX_ONLINE_GUESTS = 12;
const STEPS: Key[] = ["s.guests", "s.date", "s.time", "s.details", "s.confirm"];

type Accepted = { name: string; date: string; time: string; guests: number; requestId: string; link: string };
type Fields = "name" | "email" | "phone";

function validate(form: { name: string; email: string; phone: string; notes: string; consent: boolean }, t: (k: Key) => string) {
  const e: Record<string, string> = {};
  if (form.name.trim().length < 2 || form.name.trim().length > 100) e["name"] = t("e.name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) || form.email.trim().length > 200) e["email"] = t("e.email");
  const phone = form.phone.trim();
  if (!/^[+\d\s()./-]+$/.test(phone) || phone.replace(/\D/g, "").length < 5 || phone.length > 40) e["phone"] = t("e.phone");
  if (form.notes.trim().length > 500) e["notes"] = t("e.notes");
  if (!form.consent) e["consent"] = t("e.consent");
  return e;
}

export default function ReservationPage() {
  const { lang, t } = useI18n();
  const locale = DATE_LOCALES[lang];
  const [step, setStep] = useState(0);
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>();
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "", website: "", consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Accepted>();
  const [copied, setCopied] = useState(false);
  // One id/token pair per request: a retry after a lost response is idempotent on the server.
  const key = useRef<{ requestId: string; token: string } | null>(null);
  const sending = useRef(false);

  const dateKey = date ? format(date, "yyyy-MM-dd") : "";
  const slots = useMemo(
    () => slotsForDate(dateKey).map((slot) => ({ slot, open: isFutureSlot(dateKey, slot) })),
    [dateKey],
  );

  const submit = async () => {
    if (form.website) return; // honeypot
    if (sending.current) return;
    const found = validate(form, t);
    if (Object.keys(found).length) return setErrors(found);
    if (!dateKey || !time || !isFutureSlot(dateKey, time)) return setErrors({ form: t("e.slot") });
    sending.current = true;
    setBusy(true);
    setErrors({});
    key.current ??= {
      requestId: secureId(),
      token: Array.from(crypto.getRandomValues(new Uint8Array(32))).map((x) => x.toString(16).padStart(2, "0")).join(""),
    };
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...key.current,
          name: form.name, email: form.email, phone: form.phone, notes: form.notes,
          guests, date: dateKey, time, website: "", accepted: form.consent,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string; name?: string; date?: string; time?: string; guests?: number };
      if (!res.ok || !data.date || !data.time) {
        // Localize by the API's structured code; the German `error` text is only a compatibility fallback.
        setErrors({ form: t(data.code || data.error ? errorKey(data) : "e.send") });
        return;
      }
      setDone({
        name: data.name ?? form.name, date: data.date, time: data.time, guests: data.guests ?? guests,
        requestId: key.current.requestId, link: `${location.origin}/reservation#${key.current.token}`,
      });
      setStep(4);
    } catch {
      setErrors({ form: t("e.send") });
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  const downloadIcs = () => {
    if (!done) return;
    const url = URL.createObjectURL(new Blob([icsFor({ uid: done.requestId, ...done })], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "NEA1889-Tischanfrage.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyLink = async () => {
    if (!done) return;
    try {
      await navigator.clipboard.writeText(done.link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const field = "w-full border border-ochre/60 bg-card px-3 py-3 text-base";
  const today = berlinClock().date;

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-12">
        <p className="font-serif-it text-xl text-ochre">Prenota il tuo tavolo</p>
        <h1 className="font-display text-[clamp(2.2rem,9vw,6rem)] break-words text-plaster">{t("r.title")}</h1>
        <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{t("r.demo")}</p>

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
              <div className="mt-4 inline-block border border-ochre/60 bg-card">
                <Calendar
                  mode="single" locale={locale} weekStartsOn={1} selected={date}
                  onSelect={(d) => { setDate(d); setTime(undefined); }}
                  disabled={(d) => format(d, "yyyy-MM-dd") < today}
                  className="p-3 pointer-events-auto"
                />
              </div>
            </div>
          )}

          {step === 2 && date && (
            <div>
              <h2 className="font-display text-4xl">A che ora?</h2>
              <p className="font-serif-it text-muted-foreground">
                {format(date, "EEEE, d MMMM", { locale })} · {t("r.timeSub", { n: maxTableMinutes })}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {slots.map(({ slot, open }) => (
                  <button key={slot} type="button" disabled={!open} onClick={() => setTime(slot)} aria-pressed={time === slot}
                    className={`border border-ochre/60 px-2 py-3 text-left ${time === slot ? "bg-blood text-plaster" : open ? "bg-card hover:bg-ochre hover:text-soot" : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"}`}>
                    <span className="block font-display text-2xl">{slot}</span>
                    <span className="block text-xs">{t("r.until")} {tableEndTime(slot)}{open ? "" : ` · ${t("st.past")}`}</span>
                  </button>
                ))}
              </div>
              {slots.every((x) => !x.open) && <p className="mt-4 font-semibold text-destructive">{t("r.noSlots")}</p>}
            </div>
          )}

          {step === 3 && (
            <form noValidate onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
              <h2 className="font-display text-4xl">I tuoi dati</h2>
              <p className="font-serif-it -mt-3 text-muted-foreground">{t("r.detailsSub")}</p>
              {(["name", "email", "phone"] as Fields[]).map((k) => (
                <div key={k}>
                  <label htmlFor={k} className="font-display text-lg">
                    {t(k === "name" ? "f.name" : k === "email" ? "f.email" : "f.phone")} *
                  </label>
                  <input id={k} type={k === "email" ? "email" : k === "phone" ? "tel" : "text"}
                    autoComplete={k === "phone" ? "tel" : k} value={form[k]} aria-invalid={!!errors[k]}
                    aria-describedby={errors[k] ? `${k}-err` : undefined}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={field} maxLength={200} />
                  {errors[k] && <p id={`${k}-err`} className="mt-1 text-sm font-semibold text-destructive">{errors[k]}</p>}
                </div>
              ))}
              <div>
                <label htmlFor="notes" className="font-display text-lg">{t("f.notes")}</label>
                <textarea id="notes" rows={3} maxLength={500} value={form.notes} aria-invalid={!!errors["notes"]}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} className={field} />
                {errors["notes"] && <p className="mt-1 text-sm font-semibold text-destructive">{errors["notes"]}</p>}
              </div>
              <div aria-hidden="true" className="absolute -left-[9999px]">
                <label htmlFor="website">Website</label>
                <input id="website" tabIndex={-1} autoComplete="off" value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <div className="flex items-start gap-3">
                <input id="consent" type="checkbox" checked={form.consent} aria-invalid={!!errors["consent"]}
                  aria-describedby={errors["consent"] ? "consent-err" : undefined}
                  className="mt-1 size-5 shrink-0 accent-[var(--ochre)]"
                  onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
                <label htmlFor="consent" className="text-sm">
                  {t("f.consent")}{" "}
                  <Link href="/datenschutz" className="underline">{t("f.consentLink")}</Link>. *
                </label>
              </div>
              {errors["consent"] && <p id="consent-err" className="text-sm font-semibold text-destructive">{errors["consent"]}</p>}
              {errors["form"] && <p role="alert" className="text-sm font-semibold text-destructive">{errors["form"]}</p>}
              <button type="submit" disabled={busy}
                className="poster-shadow w-full border border-ochre/60 bg-blood px-6 py-4 font-display text-2xl text-plaster disabled:opacity-60">
                {busy ? t("f.sending") : t("f.submit")}
              </button>
            </form>
          )}

          {step === 4 && done && (
            <div className="text-center" role="status">
              <Sticker tone="ochre" className="rotate-[-4deg] text-2xl">Grazie, {done.name.split(" ")[0]}!</Sticker>
              <h2 className="font-display mt-6 text-5xl text-ochre">Tavolo richiesto</h2>
              <p className="mx-auto mt-3 max-w-md">{t("c.pending")}</p>
              <dl className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-2 text-left">
                <dt className="text-muted-foreground">{t("c.date")}</dt>
                <dd className="font-semibold">{format(new Date(`${done.date}T12:00:00`), "EEE, d MMM yyyy", { locale })}</dd>
                <dt className="text-muted-foreground">{t("c.time")}</dt>
                <dd className="font-semibold">{done.time} – {tableEndTime(done.time)}</dd>
                <dt className="text-muted-foreground">{t("c.guests")}</dt>
                <dd className="font-semibold">{done.guests}</dd>
              </dl>
              <p className="mt-6 text-sm text-muted-foreground">{t("c.number")}</p>
              <input aria-label={t("c.number")} readOnly value={done.link} onFocus={(e) => e.target.select()}
                className={`${field} mx-auto mt-1 max-w-md text-center text-sm`} />
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a href={done.link} className="poster-shadow border border-ochre/60 bg-blood px-6 py-3 font-display text-xl text-plaster">{t("c.statusLink")}</a>
                <button type="button" onClick={copyLink} className="poster-shadow border border-ochre/60 bg-card px-6 py-3 font-display text-xl">
                  {copied ? t("c.copied") : t("c.copy")}
                </button>
                <button type="button" onClick={downloadIcs} className="poster-shadow border border-ochre/60 bg-gulf px-6 py-3 font-display text-xl text-plaster">
                  {t("c.ics")}
                </button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{t("c.noMail")}</p>
            </div>
          )}

          {step < 4 && (
            <div className="mt-8 flex justify-between gap-4">
              <button type="button" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}
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
