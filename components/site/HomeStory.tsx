"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/site/i18n";
const counter640 = { url: "/story/counter-640.webp" };
const counter1280 = { url: "/story/counter-1280.webp" };
const logoStack = { url: "/story/logo-nea-stack.webp" };
const logoNea = { url: "/story/logo-nea1889.webp" };
const emblem = { url: "/story/emblem-round.webp" };
const tile = { url: "/story/emblem-tile.webp" };
const oreWide = { url: "/story/ore-wide.mp4" };
const oreTall = { url: "/story/ore-tall.mp4" };
const oreWideP = { url: "/story/ore-wide.webp" };
const oreTallP = { url: "/story/ore-tall.webp" };
const dough640 = { url: "/story/dough-640.webp" };
const jars640 = { url: "/story/jars-640.webp" };
const slice640 = { url: "/story/slice-640.webp" };
const slice1280 = { url: "/story/slice-1280.webp" };
const oven640 = { url: "/story/oven-640.webp" };
const hands640 = { url: "/story/hands-640.webp" };
const knead640 = { url: "/story/knead-640.webp" };
const drink640 = { url: "/story/drink-640.webp" };
const peel640 = { url: "/story/peel-640.webp" };
const fold640 = { url: "/story/fold-640.webp" };
const neon640 = { url: "/story/neon-640.webp" };
const neon1280 = { url: "/story/neon-1280.webp" };
const oven2640 = { url: "/story/oven2-640.webp" };
const dessert640 = { url: "/story/dessert-640.webp" };
const cut640 = { url: "/story/cut-640.webp" };
const tray640 = { url: "/story/tray-640.webp" };
const top640 = { url: "/story/topview-640.webp" };

/** Adds data-shown when the element scrolls into view (drives .rv transitions). */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = [root, ...Array.from(root.querySelectorAll<HTMLElement>(".rv"))];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.setAttribute("data-shown", ""); io.unobserve(e.target); } }),
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

const pattern = { backgroundImage: `url(${tile.url}), radial-gradient(120% 80% at 70% 20%, var(--blood) 0%, oklch(0.28 0.1 27) 55%, var(--soot) 100%)`, backgroundSize: "120px 120px, cover" };

function Photo({ src, alt = "", className = "", d = 0, rot = 0 }: { src: string; alt?: string; className?: string; d?: number; rot?: number }) {
  return (
    <div className={`rv story-photo overflow-hidden rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] ${className}`} style={{ ["--d" as string]: `${d}ms`, ["--r" as string]: `${rot}deg` }}>
      <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-[1.6s] ease-out hover:scale-105" />
    </div>
  );
}

function Card({ children, className = "", d = 0 }: { children: ReactNode; className?: string; d?: number }) {
  return (
    <div className={`rv story-card rounded-3xl bg-[linear-gradient(90deg,oklch(0.2_0.06_27/0.85),oklch(0.42_0.16_27/0.85))] p-6 backdrop-blur-sm sm:p-8 ${className}`} style={{ ["--d" as string]: `${d}ms` }}>
      {children}
    </div>
  );
}

function Head({ a, b, sub }: { a: string; b: string; sub?: string }) {
  return (
    <>
      <h2 className="font-cond text-[clamp(1.6rem,4.2vw,2.4rem)] leading-[1.02] uppercase text-plaster">{a}{b && <><br />{b}</>}</h2>
      {sub && <p className="font-serif mt-1 text-[clamp(1.15rem,2.6vw,1.5rem)] text-plaster">{sub}</p>}
    </>
  );
}
const Mono = ({ children }: { children: ReactNode }) => (
  <p className="font-mono-ed mt-4 text-[12px] leading-[1.55] tracking-wide uppercase text-plaster/90 sm:text-[13px]">{children}</p>
);
const Quote = ({ children, red }: { children: ReactNode; red?: boolean }) => (
  <p className={red ? "font-mono-ed mt-4 text-[13px] tracking-wide uppercase text-[oklch(0.62_0.2_27)]" : "font-serif-it mt-5 text-[clamp(1.2rem,2.6vw,1.55rem)] leading-snug text-plaster"}>“{children}”</p>
);

function Brand() {
  return (
    <div className="rv relative inline-block">
      <img src={logoNea.url} alt="Authentic NEA 1889 Neapolitan" width={1032} height={416} loading="lazy" className="w-[min(78vw,340px)]" />
    </div>
  );
}

export function HomeStory() {
  return (
    <div className="flex flex-col">
      <ChapterNea />
      <ChapterOre />
      <ChapterCities />
      <ChapterTradition />
      <ChapterRoot />
    </div>
  );
}

/* 02 — NEA 1889 · The invisible hours */
function ChapterNea() {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="relative bg-soot">
      <div className="story-zoom relative h-[78svh] min-h-[460px] overflow-hidden sm:h-[100svh]">
        <img src={counter1280.url} srcSet={`${counter640.url} 640w, ${counter1280.url} 1280w`} sizes="100vw" alt="Pizze napoletane auf dem Tresen" loading="lazy" decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[60%_center]" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-soot/30 via-transparent to-soot" />
        <div className="absolute inset-x-0 top-[8%] flex flex-col items-center gap-3 px-6">
          <img src={emblem.url} alt="" aria-hidden width={291} height={291} className="rv home-emblem w-20 sm:w-28" />
          <img src={logoStack.url} alt="NEA 1889" width={794} height={606} className="rv w-[min(70vw,420px)] drop-shadow-[0_6px_30px_rgba(0,0,0,0.7)]" style={{ ["--d" as string]: "150ms" }} />
        </div>
      </div>
      <div className="relative -mt-10 sm:-mt-16" style={pattern}>
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 sm:grid-cols-[auto_auto_1fr] sm:items-start sm:gap-10 sm:py-14">
          <h2 className="rv font-cond text-3xl leading-none uppercase text-plaster sm:text-4xl">The invisible<br />hours.</h2>
          <p className="rv font-cond text-xl leading-tight uppercase text-ochre sm:text-2xl" style={{ ["--d" as string]: "100ms" }}>Addà passà a<br />nuttata!</p>
          <div className="rv" style={{ ["--d" as string]: "200ms" }}>
            <p className="font-mono-ed text-[12px] leading-[1.6] tracking-wide uppercase text-plaster/90 sm:text-[13px]">The most important parts of food often happen before anyone sits down. Waiting. Watching. Adjusting. Choosing not to rush. A name like 72 Ore puts time in the foreground: a reminder that care is a process you rarely see.</p>
            <Quote red>The work you don’t see can change everything.</Quote>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 03 — 72 ORE · Look closer */
function ChapterOre() {
  const ref = useReveal<HTMLElement>();
  const vid = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = vid.current;
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tall = window.matchMedia("(max-aspect-ratio: 4/5)").matches;
    v.poster = tall ? oreTallP.url : oreWideP.url;
    const io = new IntersectionObserver(([e]) => {
      if (!e) return;
      if (e.isIntersecting) { if (!v.src) v.src = tall ? oreTall.url : oreWide.url; if (!reduce) v.play().catch(() => {}); }
      else v.pause();
    }, { rootMargin: "200px 0px" });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <section ref={ref} className="relative bg-soot">
      <div className="story-zoom relative h-[85svh] min-h-[480px] overflow-hidden sm:h-[100svh]">
        <video ref={vid} muted loop playsInline preload="none" aria-label="72 Ore by NEA 1889" className="absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-soot/40 via-transparent to-soot" />
        <div className="absolute inset-x-0 bottom-16 flex justify-between px-5 md:hidden">
          <p className="rv font-mono-ed text-[11px] tracking-widest uppercase text-plaster">Tradition is<br />our religion.</p>
          <p className="rv font-mono-ed text-right text-[11px] tracking-widest uppercase text-plaster">Addà passà<br />a nuttata.</p>
        </div>
      </div>
      <div className="relative" style={pattern}>
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 sm:py-14 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-10">
          <img src={emblem.url} alt="" aria-hidden width={291} height={291} loading="lazy" className="rv hidden w-28 md:block" />
          <div className="rv">
            <div className="flex flex-wrap items-end gap-x-10 gap-y-2">
              <h2 className="font-cond text-3xl leading-none uppercase text-plaster sm:text-4xl">Look<br />closer.</h2>
              <p className="font-cond text-lg leading-tight uppercase text-ochre">Small decisions.<br />Lasting impressions.</p>
            </div>
            <Mono>Close enough, and the picture changes. What looked like one dish becomes a landscape of textures, edges, colours and small decisions. The details deserve attention because they make an experience specific, not simply beautiful.</Mono>
            <Quote red>Attention changes what we experience.</Quote>
          </div>
          <address className="rv font-mono-ed border-t border-plaster/20 pt-5 text-[12px] leading-relaxed tracking-widest not-italic uppercase text-plaster md:border-0 md:pt-0 md:text-right">
            <span className="text-ochre">Business address</span><br />Zimmerstraße 26/27<br />Berlin-Kreuzberg 10969
          </address>
        </div>
      </div>
    </section>
  );
}

/* 04 — Two cities. One dialogue. */
function ChapterCities() {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="relative overflow-hidden" style={pattern}>
      <div className="mx-auto grid max-w-6xl gap-5 px-5 py-14 sm:py-20 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-5"><Brand /></div>
        <div className="grid grid-cols-3 gap-3 lg:col-span-7 lg:gap-4">
          <Photo src={oven640.url} alt="Holzofen" className="aspect-[3/4]" rot={-3} />
          <Photo src={jars640.url} alt="Neapel-Fotografien und Tomaten" className="aspect-[3/4]" d={120} />
          <Photo src={hands640.url} alt="Pizza wird belegt" className="aspect-[3/4]" d={240} rot={2} />
        </div>
        <Card className="lg:col-span-6 lg:-mt-6">
          <Head a="Two cities." b="One dialogue." sub="Naples by origin. Berlin by choice." />
          <Mono>Naples and Berlin do not need to resemble one another to have a conversation. One brings its memories; the other offers a different pace and a different audience. Between them, an identity can evolve without being diluted.</Mono>
          <Quote>A new city can change how you understand your old one.</Quote>
        </Card>
        <Photo src={slice1280.url} alt="Pizzastück auf grünen Tomaten" className="aspect-[4/3] lg:col-span-6 lg:aspect-auto" d={150} />
        <Photo src={dough640.url} alt="Teig mit Tomaten" className="mx-auto aspect-[16/9] w-2/3 lg:col-span-4 lg:col-start-2 lg:w-full" rot={-2} />
      </div>
    </section>
  );
}

/* 05 — Tradition is a verb · More than a circle */
function ChapterTradition() {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="relative overflow-hidden" style={pattern}>
      <div className="mx-auto grid max-w-6xl gap-5 px-5 py-14 sm:py-20 lg:grid-cols-12 lg:gap-6">
        <div className="flex items-start gap-4 lg:col-span-12">
          <Brand />
        </div>
        <Card className="lg:col-span-7">
          <Head a="Tradition is a verb." b="" sub="Berlin by choice." />
          <Mono>Culture never stands still. Tradition is not a museum display. It changes hands, crosses languages, absorbs new habits and keeps moving. What matters is knowing why a gesture matters, then finding a way to make it meaningful here, now, with the people in front of us.</Mono>
          <Quote>Culture survives because people carry it forward.</Quote>
        </Card>
        <div className="grid grid-cols-2 gap-3 lg:col-span-5 lg:gap-4">
          <Photo src={drink640.url} alt="Getränk wird eingeschenkt" className="aspect-[3/4]" rot={-2} />
          <Photo src={knead640.url} alt="Teig wird geformt" className="aspect-[3/4]" d={150} rot={2} />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:col-span-5 lg:gap-4">
          <Photo src={fold640.url} alt="Gefaltete Pizza" className="aspect-square" rot={2} />
          <Photo src={peel640.url} alt="Pizza auf der Schaufel" className="aspect-square" d={150} rot={-3} />
        </div>
        <Card className="lg:col-span-7" d={100}>
          <Head a="More than a circle." b="" sub="The crust is only the beginning." />
          <Mono>Pizza can be ordinary, ceremonial, shared, eaten quickly, argued over, remembered. Its power lies in how easily it belongs to everyday life. The photograph is not proof of perfection. It is the beginning of a larger story about hands, heat and appetite.</Mono>
          <Quote>Culture survives because people carry it forward.</Quote>
        </Card>
      </div>
    </section>
  );
}

/* 06 — One root. Many expressions. */
function ChapterRoot() {
  const ref = useReveal<HTMLElement>();
  const { t } = useI18n();
  return (
    <section ref={ref} className="relative overflow-hidden" style={pattern}>
      <div className="mx-auto grid max-w-6xl gap-5 px-5 py-14 sm:py-20 lg:grid-cols-12 lg:gap-6">
        <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] lg:col-span-12 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {[tray640, oven2640, cut640, top640].map((p, i) => (
            <Photo key={p.url} src={p.url} className="aspect-[4/3] w-[62vw] shrink-0 snap-center sm:w-[40vw] lg:w-auto" d={i * 100} rot={i % 2 ? 2 : -2} />
          ))}
        </div>
        <div className="lg:col-span-5"><Brand /></div>
        <div className="hidden lg:col-span-7 lg:block" />
        <Card className="lg:col-span-5">
          <Head a="One root." b="Many expressions." />
          <Mono>NEA 1889 gives our world a name and a point of view. 72 Ore by NEA 1889 is another expression of that same identity. Not two unrelated stories: one cultural thread, different moments and different reasons to gather. Rooted in Naples. Evolving in Berlin.</Mono>
          <Quote>Naples by origin. Berlin by choice.</Quote>
        </Card>
        <div className="grid gap-3 lg:col-span-7 lg:grid-cols-[1fr_auto] lg:gap-4">
          <Photo src={neon1280.url} alt="NEA Neonschild" className="aspect-[16/10] lg:aspect-auto" d={120} />
          <Photo src={dessert640.url} alt="Dessert" className="hidden aspect-[2/3] w-40 lg:block" d={240} rot={3} />
        </div>
        <div className="rv flex flex-col items-center gap-5 pt-6 text-center lg:col-span-12">
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/reservierung" className="btn-shine inline-flex min-h-12 items-center rounded-full bg-ochre px-8 font-display text-sm tracking-[0.2em] text-soot">{t("home.ctaBook")}</Link>
            <Link href="/menu" className="inline-flex min-h-12 items-center rounded-full border border-plaster/60 px-8 font-display text-sm tracking-[0.2em] text-plaster transition-colors hover:bg-plaster hover:text-soot">{t("home.ctaMenu")}</Link>
          </div>
          <p className="font-mono-ed text-[11px] tracking-widest uppercase text-plaster/60">Photography & video: Moritz Binner · Mr. Gabriel · 2026</p>
        </div>
      </div>
    </section>
  );
}
