import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { LanguageDropdown, LanguageTiles } from "./LanguageSwitcher";
import type { Key } from "@/lib/i18n-dict";
import marble from "@/assets/brochure/marble-1920.webp";
import marbleSm from "@/assets/brochure/marble-mobile.webp";
import emblem from "@/assets/brochure/emblem-160.webp";

const nav = [
  { to: "/", label: "nav.home" },
  { to: "/menu", label: "nav.menu" },
  { to: "/reservierung", label: "nav.book" },
] as const satisfies readonly { to: string; label: Key }[];

export const marbleStyle = { "--marble-url": `url(${marble})`, "--marble-url-sm": `url(${marbleSm})` } as CSSProperties;

function SiteHeader() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-ochre/40 bg-soot/85 backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 sm:flex sm:justify-between sm:py-3">
        <Link to="/" onClick={close} className="group flex min-w-0 items-center gap-2 sm:gap-3" aria-label="NEA 1889">
          <img src={emblem} alt="" className="h-10 w-10 shrink-0 transition-transform duration-700 ease-out group-hover:rotate-[60deg] sm:h-11 sm:w-11" width={44} height={44} />
          <span className="truncate font-display text-lg tracking-[0.08em] text-plaster sm:text-2xl sm:tracking-[0.12em]">
            NEA <span className="text-ochre">1889</span>
          </span>
        </Link>
        <nav aria-label={t("nav.main")} className="hidden items-center gap-2 sm:flex lg:gap-4">
          {nav.filter((n) => n.to !== "/reservierung").map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: true }} className="nav-link px-2 py-2 font-display text-sm tracking-[0.2em] text-plaster transition-colors duration-300 hover:text-ochre data-[status=active]:text-ochre">
              {t(n.label)}
            </Link>
          ))}
          <LanguageDropdown />
          <Link to="/reservierung" className="btn-shine inline-flex h-11 items-center bg-ochre px-5 font-display text-sm tracking-[0.2em] text-soot transition-[background-color,box-shadow] duration-300 hover:bg-plaster hover:shadow-[0_0_28px_-6px_var(--ochre)]">
            {t("nav.book")}
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:hidden">
          <Link to="/reservierung" onClick={close} className="btn-shine inline-flex h-11 items-center bg-ochre px-3 font-display text-xs tracking-[0.15em] text-soot active:scale-95">
            {t("nav.bookShort")}
          </Link>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-nav"
            aria-label={open ? t("nav.close") : t("nav.open")}
            className="burger relative inline-flex h-11 w-11 items-center justify-center border border-ochre/60 text-plaster transition-colors duration-300 active:scale-95" data-open={open}>
            <span aria-hidden className="burger-line" /><span aria-hidden className="burger-line" /><span aria-hidden className="burger-line" />
          </button>
        </div>
      </div>
      <div id="mobile-nav" data-open={open} inert={!open} className="drawer grid border-ochre/30 bg-soot/95 sm:hidden">
        <nav aria-label={t("nav.main")} className="min-h-0 overflow-hidden">
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {nav.map((n, i) => (
              <li key={n.to} className="drawer-item" style={{ ["--i" as string]: i }}>
                <Link to={n.to} onClick={close} activeOptions={{ exact: true }}
                  className="flex min-h-12 items-center justify-between border-b border-ochre/15 font-display text-lg tracking-[0.15em] text-plaster data-[status=active]:text-ochre">
                  {t(n.label)} <span aria-hidden className="text-ochre/70">→</span>
                </Link>
              </li>
            ))}
            <li className="drawer-item border-b border-ochre/15 py-4" style={{ ["--i" as string]: 3 }}>
              <p className="mb-3 font-display text-xs tracking-[0.25em] text-ochre uppercase">{t("lang")}</p>
              <LanguageTiles />
            </li>
            <li className="drawer-item py-4 text-sm text-plaster/80" style={{ ["--i" as string]: 4 }}>
              Zimmerstraße 26/27 · <a href="tel:+493098465557" className="text-ochre underline underline-offset-4">030 984 655 57</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

/** Soft fade/blur on the page content whenever the language changes (no remount, keeps form state). */
function useLangFade() {
  const { lang } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.animate(
      [{ opacity: 0.25, filter: "blur(3px)", transform: "translateY(6px)" }, { opacity: 1, filter: "blur(0)", transform: "none" }],
      { duration: 550, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
  }, [lang]);
  return ref;
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const mainRef = useLangFade();
  return (
    <div style={marbleStyle} className="marble flex min-h-screen flex-col text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-2">
        {t("skip")}
      </a>
      <div className="border-b border-ochre/30 bg-soot/80 py-1.5 text-center text-[11px] tracking-[0.35em] text-ochre uppercase">
        {t("proto")}
      </div>
      <SiteHeader />
      <main ref={mainRef} id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-ochre/40 bg-soot/85">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
          <div className="flex items-center gap-4">
            <img src={emblem} alt="NEA 1889 Logo" className="h-16 w-auto" width={80} height={80} loading="lazy" />
            <div>
              <p className="font-display text-2xl tracking-[0.12em]">NEA 1889</p>
              <p className="font-serif-it text-lg text-ochre">Naples at heart. Berlin by choice.</p>
            </div>
          </div>
          <address className="text-sm leading-relaxed not-italic text-muted-foreground">
            Zimmerstraße 26/27
            <br />
            10969 Berlin-Kreuzberg
          </address>
          <ul className="space-y-1 text-sm">
            <li><Link to="/impressum" className="hover:text-ochre">{t("footer.imprint")}</Link></li>
            <li><Link to="/datenschutz" className="hover:text-ochre">{t("footer.privacy")}</Link></li>
            <li><Link to="/staff" className="hover:text-ochre">Staff Login</Link></li>
          </ul>
        </div>
        <p className="border-t border-ochre/20 py-3 text-center font-display text-[11px] tracking-[0.35em] text-ochre">
          Berlin – Napoli – Sempre
        </p>
      </footer>
    </div>
  );
}

/** Brochure-style section header: gold number, serif title, gold rule. */
export function SectionHead({ num, title, sub, tone = "plaster" }: { num: string; title: string; sub?: string; tone?: "plaster" | "gulf" }) {
  return (
    <div>
      <p className="font-display text-lg text-ochre">{num}.</p>
      <h2 className={`font-display text-[clamp(2.4rem,6vw,4.5rem)] ${tone === "gulf" ? "text-[oklch(0.6_0.12_250)]" : "text-plaster"}`}>{title}</h2>
      {sub && <p className="font-display mt-1 text-[clamp(1.4rem,3.5vw,2.6rem)] text-ochre">{sub}</p>}
      <div className="gold-rule mt-4 w-48" />
    </div>
  );
}

export function Sticker({
  children,
  tone = "ochre",
  className = "",
}: {
  children: ReactNode;
  tone?: "ochre" | "blood" | "gulf" | "plaster";
  className?: string;
}) {
  const tones = {
    ochre: "bg-ochre text-soot",
    blood: "bg-blood text-plaster",
    gulf: "bg-gulf text-plaster",
    plaster: "bg-plaster text-soot",
  };
  return <span className={`sticker px-4 py-2 ${tones[tone]} ${className}`}>{children}</span>;
}