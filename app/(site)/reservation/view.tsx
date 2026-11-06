"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { DATE_LOCALES, useI18n } from "@/lib/site/i18n";
import type { Key } from "@/lib/site/i18n-dict";
import { SiteLayout, Sticker } from "@/components/site/SiteChrome";
import { errorKey, statusKey, tokenFromHash } from "@/lib/guest-status";
import { tableEndTime } from "@/lib/reservation-rules";

type Booking = { name: string; date: string; time: string; guests: number; status: string; duration: number };
const SETTLED = ["cancelled", "noshow", "arrived"];
const btn = "poster-shadow border border-ochre/60 px-6 py-3 font-display text-xl disabled:opacity-60";

export default function StatusPage() {
  const { t, lang } = useI18n();
  const locale = DATE_LOCALES[lang];
  const token = useRef<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<Key | null>(null);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);

  // The token lives in the URL fragment and is sent only as a header; nothing is stored in the browser.
  const load = useCallback(async (method: "GET" | "PATCH" = "GET") => {
    if (!token.current) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/booking", { method, headers: { "X-Booking-Token": token.current } });
      const data = (await res.json().catch(() => ({}))) as Partial<Booking> & { error?: string; code?: string };
      if (!res.ok || !data.date || !data.time) {
        setError(errorKey(data));
        return;
      }
      setBooking(data as Booking);
      setAsking(false);
    } catch {
      setError("err.unavailable");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    token.current = tokenFromHash(window.location.hash);
    if (!token.current) {
      setError("err.token_missing");
      return;
    }
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 60000);
    return () => clearInterval(timer);
  }, [load]);

  const cancellable = booking && ["pending", "confirmed"].includes(booking.status);
  const tone = booking?.status === "confirmed" || booking?.status === "arrived" ? "gulf" : booking?.status === "pending" ? "ochre" : "blood";

  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-4 py-12">
        <p className="font-serif-it text-xl text-ochre">NEA 1889 · Zimmerstraße 26/27</p>
        <h1 className="font-display text-[clamp(2.2rem,9vw,5rem)] break-words text-plaster">{t("rs.title")}</h1>

        <div className="poster-shadow mt-8 border border-ochre/60 bg-card p-6 sm:p-8" aria-busy={busy}>
          <div aria-live="polite" role="status">
            {booking && (
              <div>
                <Sticker tone={tone} className="rotate-[-2deg] text-xl">{t(statusKey(booking.status))}</Sticker>
                <h2 className="font-display mt-6 text-4xl">{booking.name}</h2>
                <dl className="mt-4 grid max-w-sm grid-cols-2 gap-2">
                  <dt className="text-muted-foreground">{t("c.date")}</dt>
                  <dd className="font-semibold">{format(new Date(`${booking.date}T12:00:00`), "EEEE, d MMMM yyyy", { locale })}</dd>
                  <dt className="text-muted-foreground">{t("c.time")}</dt>
                  <dd className="font-semibold">{booking.time} – {tableEndTime(booking.time)}</dd>
                  <dt className="text-muted-foreground">{t("c.guests")}</dt>
                  <dd className="font-semibold">{booking.guests}</dd>
                </dl>
                {booking.status === "pending" && <p className="mt-5">{t("rs.pendingNote")}</p>}
                {booking.status === "cancelled" && <p className="mt-5">{t("rs.cancelledNote")}</p>}
              </div>
            )}
            {!booking && !error && <p>{t("rs.loading")}</p>}
          </div>

          {error && <p role="alert" className="mt-4 border-3 border-destructive bg-destructive/15 p-3 text-sm font-semibold">{t(error)}</p>}

          {booking && (
            <p className="mt-5 text-sm text-muted-foreground">
              Zimmerstraße 26/27, 10969 Berlin ·{" "}
              <a href="tel:+493098465557" className="underline hover:text-ochre">030 984 655 57</a>
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {booking && (
              <button type="button" disabled={busy} onClick={() => void load()} className={`${btn} bg-blood text-plaster`}>{t("rs.refresh")}</button>
            )}
            {cancellable && !asking && (
              <button type="button" onClick={() => setAsking(true)} className={`${btn} bg-card`}>{t("rs.cancel")}</button>
            )}
            {!booking && error === "err.token_missing" && (
              <Link href="/reservierung" className={`${btn} bg-blood text-plaster`}>{t("rs.noToken")}</Link>
            )}
          </div>

          {cancellable && asking && (
            <div role="group" aria-label={t("rs.cancel")} className="mt-6 border-3 border-destructive bg-destructive/15 p-4">
              <p className="font-semibold">{t("rs.cancelAsk")}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" disabled={busy} onClick={() => void load("PATCH")} className={`${btn} bg-blood text-plaster`}>{t("rs.cancelYes")}</button>
                <button type="button" onClick={() => setAsking(false)} className={`${btn} bg-card`}>{t("rs.cancelBack")}</button>
              </div>
            </div>
          )}

          {booking && <p className="mt-6 text-xs text-muted-foreground">{t("rs.keepLink")}</p>}
          <p className="mt-4"><Link href="/reservierung" className="underline hover:text-ochre">{t("rs.newRequest")}</Link></p>
        </div>
      </section>
    </SiteLayout>
  );
}
