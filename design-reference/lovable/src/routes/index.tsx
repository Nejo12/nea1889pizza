import { createFileRoute, Link } from "@tanstack/react-router";
import { SectionHead, SiteLayout, Sticker } from "@/components/site/SiteChrome";
import { useI18n } from "@/lib/i18n";
import { SHIFTS } from "@/lib/reservations";
import hero640 from "@/assets/brochure/opt/hero-vesuvio-640.webp.asset.json";
import hero1280 from "@/assets/brochure/opt/hero-vesuvio-1280.webp.asset.json";
import collage640 from "@/assets/brochure/opt/vision-collage-640.webp.asset.json";
import collage1280 from "@/assets/brochure/opt/vision-collage-1280.webp.asset.json";
import posterNapoli640 from "@/assets/brochure/opt/poster-napoli-640.webp.asset.json";
import posterNapoli1280 from "@/assets/brochure/opt/poster-napoli-1280.webp.asset.json";
import posterGennaro640 from "@/assets/brochure/opt/poster-gennaro-640.webp.asset.json";
import posterGennaro1280 from "@/assets/brochure/opt/poster-gennaro-1280.webp.asset.json";
import stickers640 from "@/assets/brochure/opt/stickers-640.webp.asset.json";
import stickers1280 from "@/assets/brochure/opt/stickers-1280.webp.asset.json";
import merch640 from "@/assets/brochure/opt/merch-640.webp.asset.json";
import merch1280 from "@/assets/brochure/opt/merch-1280.webp.asset.json";
import alley640 from "@/assets/brochure/opt/alley-strip-640.webp.asset.json";
import logo72 from "@/assets/brochure/logo-72ore.jpg.asset.json";
import logoNea from "@/assets/brochure/logo-nea.jpg.asset.json";
import texTiles from "@/assets/brochure/tex-tiles.jpg.asset.json";
import texPlaster from "@/assets/brochure/tex-plaster.jpg.asset.json";
import texPattern from "@/assets/brochure/tex-npattern.jpg.asset.json";

const SIZES = {
  hero: "100vw",
  collage: "(min-width: 768px) 50vw, 100vw",
  posterNapoli: "(min-width: 768px) 40vw, 100vw",
  posterGennaro: "(min-width: 768px) 40vw, 100vw",
  stickers: "(min-width: 1152px) 1152px, 100vw",
  merch: "100vw",
} as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEA 1889 – Neapolitanische Pizza in Berlin-Kreuzberg" },
      { name: "description", content: "Pizza napoletana mit 72 Stunden Teigführung. Zimmerstraße 26/27, 10969 Berlin. Jetzt Tisch reservieren." },
      { property: "og:title", content: "NEA 1889 – Napoli in Berlin" },
      { property: "og:description", content: "72 Ore Teig, Ofen aus Neapel, Kreuzberger Seele. Reserviere deinen Tisch." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const goldBtn =
  "inline-block border border-ochre bg-ochre px-7 py-3.5 font-display text-sm tracking-[0.25em] text-soot transition-colors hover:bg-plaster";
const ghostBtn =
  "inline-block border border-ochre px-7 py-3.5 font-display text-sm tracking-[0.25em] text-ochre transition-colors hover:bg-ochre hover:text-soot";

const principles = [
  { n: "01", t: "L'impasto", h: "home.p1h", text: "home.p1", img: texPlaster.url },
  { n: "02", t: "La materia", h: "home.p2h", text: "home.p2", img: texTiles.url },
  { n: "03", t: "Il forno", h: "home.p3h", text: "home.p3", img: texPattern.url },
] as const;

function Home() {
  const { t } = useI18n();
  return (
    <SiteLayout>
      {/* 01 — Cover */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-12 text-center md:pt-16">
          <h1 className="font-display text-[clamp(3.2rem,11vw,8.5rem)] font-semibold tracking-[0.06em] text-plaster">
            NEA <span className="text-ochre">1889</span>
          </h1>
          <p className="font-display mt-2 text-[clamp(0.75rem,2vw,1.4rem)] tracking-[0.2em] sm:tracking-[0.4em] text-ochre">
            Pizzeria Napoletana · Berlin
          </p>
        </div>
        <div className="relative mt-8">
          <img src={hero1280.url} srcSet={`${hero640.url} 640w, ${hero1280.url} 1280w`} sizes={SIZES.hero} alt={t("home.heroAlt")} className="w-full object-cover" fetchPriority="high" decoding="async" width={1410} height={835} />
          <div className="absolute top-4 left-4 hidden md:block">
            <p className="font-display text-sm leading-relaxed tracking-[0.25em] text-plaster/90">
              Napoli —<br />Kreuzberg<br />dal 1889
            </p>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-4 py-10">
          <Link to="/reservierung" className={goldBtn}>{t("home.ctaBook")}</Link>
          <Link to="/menu" className={ghostBtn}>{t("home.ctaMenu")}</Link>
        </div>
        <div className="pointer-events-none absolute top-24 right-4 hidden lg:block">
          <Sticker tone="ochre" className="rotate-6 rounded-full p-5! text-sm leading-tight">In Crust<br />We Trust</Sticker>
        </div>
      </section>

      {/* 02 — Vision */}
      <section className="border-y border-ochre/30 bg-soot/60">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1fr_1.3fr]">
          <div>
            <SectionHead num="02" title="La Nostra Visione" />
            <p className="mt-6 text-[17px] leading-relaxed text-plaster/90">
              {t("home.vision1")}
            </p>
            <h3 className="font-display mt-8 text-3xl text-[oklch(0.62_0.12_250)]">{t("home.visionH")}</h3>
            <div className="gold-rule mt-2 w-32" />
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {t("home.vision2")}
            </p>
          </div>
          <img src={collage1280.url} srcSet={`${collage640.url} 640w, ${collage1280.url} 1280w`} sizes={SIZES.collage} alt={t("home.collageAlt")} className="gold-frame w-full" loading="lazy" decoding="async" width={1240} height={1125} />
        </div>
      </section>

      {/* 03 — Principles */}
      <section className="relative">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.6fr_1fr]">
          <div>
            <SectionHead num="03" title="Il Mestiere" sub={t("home.craftSub")} />
            <ol className="mt-10 space-y-8">
              {principles.map((p) => (
                <li key={p.n} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-5 border-b border-ochre/25 pb-8 last:border-0">
                  <p className="font-display text-3xl whitespace-nowrap text-destructive sm:text-5xl"><span className="text-3xl text-ochre">✶</span> {p.n}</p>
                  <div>
                    <h3 className="font-display text-xl tracking-[0.1em]">{p.t}</h3>
                    <p className="font-display text-sm tracking-[0.15em] text-ochre">{t(p.h)}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(p.text)}</p>
                  </div>
                  <img src={p.img} alt="" className="gold-frame hidden h-24 w-24 object-cover sm:block" loading="lazy" decoding="async" width={96} height={96} />
                </li>
              ))}
            </ol>
          </div>
          <img src={alley640.url} alt={t("home.alleyAlt")} className="torn-left hidden h-full w-full object-cover md:block" loading="lazy" decoding="async" width={500} height={1125} />
        </div>
      </section>

      {/* 04 — Vignettes */}
      <section className="border-y border-ochre/30 bg-soot/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1fr_2fr]">
          <div>
            <SectionHead num="04" title="Le Vignette" sub={t("home.vigSub")} />
            <p className="mt-6 leading-relaxed text-plaster/90">
              {t("home.vig")}
            </p>
            <ul className="font-display mt-6 space-y-2 text-sm tracking-[0.15em] text-ochre">
              <li>✶ Napoli · a way of life</li>
              <li>✶ San Gennaro · more than a saint</li>
              <li>✶ Tradition × People × Good Food</li>
            </ul>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <img src={posterNapoli1280.url} srcSet={`${posterNapoli640.url} 640w, ${posterNapoli1280.url} 1280w`} sizes={SIZES.posterNapoli} alt={`${t("home.poster")}: Napoli – a way of life`} className="gold-frame w-full" loading="lazy" decoding="async" width={665} height={900} />
            <img src={posterGennaro1280.url} srcSet={`${posterGennaro640.url} 640w, ${posterGennaro1280.url} 1280w`} sizes={SIZES.posterGennaro} alt={`${t("home.poster")}: San Gennaro – more than a saint`} className="gold-frame w-full" loading="lazy" decoding="async" width={665} height={900} />
          </div>
        </div>
      </section>

      {/* 05 — Stickers & merch */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid items-end gap-8 md:grid-cols-[1fr_2fr]">
            <SectionHead num="05" title="Sticker" sub="& Merchandise" />
            <img src={stickers1280.url} srcSet={`${stickers640.url} 640w, ${stickers1280.url} 1280w`} sizes={SIZES.stickers} alt={t("home.stickersAlt")} className="w-full" loading="lazy" decoding="async" width={1280} height={525} />
          </div>
          <img src={merch1280.url} srcSet={`${merch640.url} 640w, ${merch1280.url} 1280w`} sizes={SIZES.merch} alt={t("home.merchAlt")} className="mt-8 w-full border-y border-ochre/40" loading="lazy" decoding="async" width={1340} height={350} />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            <img src={logo72.url} alt="72 Ore by NEA 1889" className="h-28 w-auto" loading="lazy" decoding="async" width={315} height={200} />
            <img src={logoNea.url} alt="NEA 1889 – Berlin, Napoli, Sempre" className="h-28 w-auto" loading="lazy" decoding="async" width={335} height={205} />
          </div>
        </div>
      </section>

      {/* 06 — Visit */}
      <section className="border-t border-ochre/30 bg-soot/70">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2">
          <article className="gold-frame bg-card p-8">
            <SectionHead num="06" title="Dove Siamo" />
            <address className="mt-6 text-xl leading-relaxed not-italic">
              Zimmerstraße 26/27
              <br />
              10969 Berlin-Kreuzberg
            </address>
            <p className="font-serif-it mt-2 text-lg text-ochre">a due passi dal Checkpoint Charlie</p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Zimmerstra%C3%9Fe+26%2F27+10969+Berlin"
              target="_blank"
              rel="noopener noreferrer"
              className={`${ghostBtn} mt-6`}
            >
              {t("home.maps")}
            </a>
          </article>
          <article className="gold-frame relative overflow-hidden bg-card p-8">
            <SectionHead num="07" title="Orari" />
            <dl className="mt-6 space-y-3 text-lg">
              <div className="flex justify-between border-b border-ochre/25 pb-2">
                <dt>{t("home.monday")}</dt>
                <dd className="font-display text-ochre">{t("home.closed")}</dd>
              </div>
              <div className="flex justify-between border-b border-ochre/25 pb-2">
                <dt>{t("home.tueSun")} · Pranzo</dt>
                <dd className="font-display">{SHIFTS.pranzo.open} – {SHIFTS.pranzo.close}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t("home.tueSun")} · Cena</dt>
                <dd className="font-display">{SHIFTS.cena.open} – {SHIFTS.cena.close}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs tracking-wider text-muted-foreground uppercase">{t("home.placeholder")}</p>
            <Link to="/reservierung" className={`${goldBtn} mt-6`}>{t("home.ctaBook")}</Link>
          </article>
        </div>
      </section>
    </SiteLayout>
  );
}