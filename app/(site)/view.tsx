"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/site/i18n";
import { HomeStory } from "@/components/site/HomeStory";
import { LanguageDropdown } from "@/components/site/LanguageSwitcher";
const video1280 = { url: "https://nea-naples-table-booking.lovable.app/__l5e/assets-v1/70c16a96-28f8-445a-8428-2e7f5b97c628/pizza-loop-1280.mp4" };
const video720 = { url: "https://nea-naples-table-booking.lovable.app/__l5e/assets-v1/fbb24c1f-efd5-463c-a9fe-0f12cfe8cfc2/pizza-loop-720.mp4" };
const poster = { url: "https://nea-naples-table-booking.lovable.app/__l5e/assets-v1/52d1a39d-9887-4198-a85e-3790c0263100/pizza-loop-poster.webp" };
const title = { url: "https://nea-naples-table-booking.lovable.app/__l5e/assets-v1/7a390344-53f1-491e-921d-281b94c49c0c/title.webp" };
const titleSm = { url: "https://nea-naples-table-booking.lovable.app/__l5e/assets-v1/be52a7e7-13ad-4451-aa08-d6e1ac814935/title-sm.webp" };

const linkBase =
  "home-link group absolute flex flex-col items-center text-center text-plaster drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ochre";

function HomeLink({ to, title, sub, className, i }: { to: "/reservierung" | "/menu" | "/about"; title: string; sub: string; className: string; i: number }) {
  return (
    <Link href={to} className={`${linkBase} ${className}`} style={{ ["--i" as string]: i }}>
      <span className="font-display text-[clamp(1.1rem,2.4vw,1.9rem)] tracking-[0.08em] uppercase transition-colors duration-500 group-hover:text-ochre">{title}</span>
      <span className="mt-1 text-[10px] tracking-[0.35em] uppercase text-plaster/80 sm:text-xs">{sub}</span>
      <span aria-hidden className="mt-2 h-px w-0 bg-ochre transition-all duration-500 ease-out group-hover:w-full" />
    </Link>
  );
}

export default function Home() {
  const { t } = useI18n();
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { v.pause(); return; }
    v.src = window.matchMedia("(max-width: 767px)").matches ? video720.url : video1280.url;
    v.play().catch(() => {});
  }, []);

  return (
    <main className="bg-soot">
    <section className="relative h-[100svh] w-full overflow-hidden">
      <video ref={ref} poster={poster.url} muted loop playsInline autoPlay preload="auto" aria-hidden
        className="home-video absolute inset-0 h-full w-full object-cover" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(14,12,7,0.55)_100%)]" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-soot/70 to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-soot/70 to-transparent" />

      <div className="absolute top-4 right-4 z-20"><LanguageDropdown /></div>

      <h1 className="home-title absolute inset-x-0 top-[13svh] z-10 flex justify-center px-6 sm:top-[5vh]">
        <img src={title.url} srcSet={`${titleSm.url} 448w, ${title.url} 896w`} sizes="(max-width: 640px) 88vw, 620px"
          alt="Authentic NEA 1889 Neapolitan" width={896} height={343} fetchPriority="high" decoding="async"
          className="h-auto w-[min(88vw,620px)] drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]" />
      </h1>

      <nav aria-label={t("nav.main")} className="absolute inset-0 z-10">
        <HomeLink i={0} to="/reservierung" title={t("nav.book")} sub="Merchandise" className="top-[58%] left-[4%] sm:left-[3%]" />
        <HomeLink i={1} to="/menu" title="Menù" sub="Right here" className="top-[58%] right-[4%] sm:right-[8%]" />
        <HomeLink i={2} to="/about" title={t("nav.about")} sub="NEA 1889" className="bottom-[8%] left-1/2 -translate-x-1/2" />
      </nav>
      <span aria-hidden className="scroll-cue absolute bottom-2 left-1/2 z-10 -ml-px h-6 w-px bg-ochre/80 sm:bottom-3" />
    </section>
    <HomeStory />
    </main>
  );
}
