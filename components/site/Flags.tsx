"use client";

import type { Lang } from "@/lib/site/i18n";

/** Tiny inline SVG flags (no external requests). 3:2 viewBox. */
const tri = (a: string, b: string, c: string, vertical = true) =>
  vertical ? (
    <>
      <rect width="1" height="2" fill={a} />
      <rect x="1" width="1" height="2" fill={b} />
      <rect x="2" width="1" height="2" fill={c} />
    </>
  ) : (
    <>
      <rect width="3" height="0.667" fill={a} />
      <rect y="0.667" width="3" height="0.667" fill={b} />
      <rect y="1.333" width="3" height="0.667" fill={c} />
    </>
  );

const FLAG: Record<Lang, React.ReactNode> = {
  de: tri("#000", "#DD0000", "#FFCE00", false),
  it: tri("#009246", "#fff", "#CE2B37"),
  fr: tri("#0055A4", "#fff", "#EF4135"),
  es: (
    <>
      <rect width="3" height="2" fill="#AA151B" />
      <rect y="0.5" width="3" height="1" fill="#F1BF00" />
    </>
  ),
  pt: (
    <>
      <rect width="3" height="2" fill="#FF0000" />
      <rect width="1.2" height="2" fill="#006600" />
      <circle cx="1.2" cy="1" r="0.36" fill="#FFCC00" />
      <circle cx="1.2" cy="1" r="0.22" fill="#FF0000" stroke="#fff" strokeWidth="0.05" />
    </>
  ),
  en: (
    <>
      <rect width="3" height="2" fill="#012169" />
      <path d="M0,0 L3,2 M3,0 L0,2" stroke="#fff" strokeWidth="0.4" />
      <path d="M0,0 L3,2 M3,0 L0,2" stroke="#C8102E" strokeWidth="0.15" />
      <path d="M1.5,0 V2 M0,1 H3" stroke="#fff" strokeWidth="0.6" />
      <path d="M1.5,0 V2 M0,1 H3" stroke="#C8102E" strokeWidth="0.35" />
    </>
  ),
};

export function Flag({ lang, className = "" }: { lang: Lang; className?: string }) {
  return (
    <svg viewBox="0 0 3 2" aria-hidden="true" preserveAspectRatio="none"
      className={`inline-block h-[15px] w-[22px] shrink-0 overflow-hidden rounded-[2px] shadow-[0_0_0_1px_color-mix(in_oklab,var(--ochre)_45%,transparent)] ${className}`}>
      {FLAG[lang]}
    </svg>
  );
}
