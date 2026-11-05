import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteLayout } from "@/components/site/SiteChrome";
import { useI18n, type Lang } from "@/lib/i18n";
import { ALLERGENS, MENU, allergenLabel } from "@/lib/menu-data";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu – NEA 1889 Pizza Napoletana Berlin" },
      { name: "description", content: "Antipasti, Pizze Tradizionali 1889, Le Bianche, Pizze Speciali NEA 1889, Dolci und Bevande – AVPN-Ofen, Mehl von Mulino Paolo Mariani." },
      { property: "og:title", content: "Das Menu von NEA 1889" },
      { property: "og:description", content: "Neapolitanische Pizza, Antipasti und Dolci in Berlin-Kreuzberg." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MenuPage,
});

const L: Record<Lang, { allergens: string; note: string; descLang: string; extra: string }> = {
  de: { allergens: "Allergene & Zusatzstoffe", note: "Limited-Edition-Pizza & Signature-Longdrinks: QR-Code am Tisch scannen oder unser Team fragen.", descLang: "Beschreibungen in der Originalsprache unserer Karte.", extra: "Extra" },
  en: { allergens: "Allergens & additives", note: "Limited-edition pizza & signature long drinks: scan the QR code at your table or ask our team.", descLang: "", extra: "Extra" },
  it: { allergens: "Allergeni e additivi", note: "Pizza in edizione limitata e long drink signature: scansiona il QR al tavolo o chiedi al nostro staff.", descLang: "Descrizioni nella lingua originale del nostro menu.", extra: "Extra" },
  fr: { allergens: "Allergènes & additifs", note: "Pizza en édition limitée & long drinks signature : scannez le QR code à table ou demandez à l'équipe.", descLang: "Descriptions dans la langue d'origine de notre carte.", extra: "Supplément" },
  es: { allergens: "Alérgenos y aditivos", note: "Pizza de edición limitada y long drinks de autor: escanea el QR en la mesa o pregunta al equipo.", descLang: "Descripciones en el idioma original de nuestra carta.", extra: "Extra" },
  pt: { allergens: "Alergénios e aditivos", note: "Pizza de edição limitada e long drinks de autor: leia o QR na mesa ou pergunte à equipa.", descLang: "Descrições no idioma original da nossa carta.", extra: "Extra" },
};

/** Fade/rise children into view once; respects reduced motion via CSS. */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.setAttribute("data-shown", ""); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) setActive(vis[0].target.id);
    }, { rootMargin: "-30% 0px -60% 0px" });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [ids]);
  return active;
}

const IDS = MENU.map((s) => s.id);

function MenuPage() {
  const { lang, t } = useI18n();
  const l = L[lang];
  useReveal();
  const active = useScrollSpy(IDS);
  const barRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState({ x: 0, w: 0 });

  useEffect(() => {
    const bar = barRef.current;
    const btn = bar?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!bar || !btn) return;
    setInd({ x: btn.offsetLeft, w: btn.offsetWidth });
    bar.scrollTo({ left: btn.offsetLeft - bar.clientWidth / 2 + btn.offsetWidth / 2, behavior: "smooth" });
  }, [active, lang]);

  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div data-reveal className="reveal">
          <p className="font-serif-it text-xl text-ochre">La carta · 1.21</p>
          <h1 className="font-display text-[clamp(3rem,10vw,7rem)] text-plaster">Menu</h1>
          <div className="gold-rule mt-3 w-48 rule-grow" />
          <p className="mt-5 max-w-2xl font-serif-it text-lg text-plaster/85">
            Pizza is not just food – it's a celebration of culture, tradition and togetherness. AVPN-certified oven, flour from Mulino Paolo Mariani (since 1792), organic EVO oil from Puglia & Umbria.
          </p>
          <p className="mt-3 max-w-xl text-sm">
            <span className="font-semibold">V</span> = {t("menu.veg")} · <span className="font-semibold">VG</span> = {t("menu.vegan")}
            {l.descLang && <span className="text-muted-foreground"> · {l.descLang}</span>}
          </p>
        </div>
      </section>

      <div className="sticky top-[57px] z-30 border-y border-ochre/30 bg-soot/85 backdrop-blur-md sm:top-[69px]">
        <nav aria-label={t("menu.cats")} ref={barRef} className="relative mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
          <span aria-hidden className="cat-ind" style={{ transform: `translateX(${ind.x}px)`, width: ind.w }} />
          {MENU.map((s) => (
            <a key={s.id} data-id={s.id} href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined}
              className="relative z-10 inline-flex min-h-11 shrink-0 items-center whitespace-nowrap px-3 font-display text-xs tracking-[0.15em] text-plaster transition-colors duration-500 aria-[current]:text-soot sm:text-sm">
              {s.title}
            </a>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-5xl space-y-20 px-4 py-14">
        {MENU.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`h-${s.id}`} className="scroll-mt-36">
            <div data-reveal className="reveal">
              <div className={`poster-shadow inline-block border border-ochre/60 px-5 py-3 ${s.tone}`}>
                <h2 id={`h-${s.id}`} className="font-display text-2xl sm:text-4xl">{s.title}</h2>
              </div>
              <p className="font-serif-it mt-3 text-lg text-muted-foreground">{s.it}</p>
            </div>
            {s.groups.map((g, gi) => (
              <div key={gi} className="mt-6">
                {g.sub && <h3 data-reveal className="reveal font-display text-lg tracking-[0.2em] text-ochre">{g.sub}</h3>}
                <ul className={`mt-2 ${s.id === "extra" ? "grid gap-x-10 sm:grid-cols-2" : ""}`}>
                  {g.items.map((it, i) => (
                    <li key={it.name} data-reveal className="reveal menu-row group flex items-start justify-between gap-4 border-b border-ochre/20 py-4" style={{ ["--d" as string]: `${(i % 6) * 70}ms` }}>
                      <div className="min-w-0">
                        <p className="font-display text-lg transition-colors duration-300 group-hover:text-ochre sm:text-2xl">
                          {it.name}
                          {it.tags?.map((tag) => (
                            <abbr key={tag} title={tag === "V" ? t("menu.veg") : t("menu.vegan")}
                              className={`ml-2 inline-block rounded-full border border-ochre/60 px-2 align-middle font-sans text-xs font-bold no-underline ${tag === "VG" ? "bg-gulf text-plaster" : "bg-ochre text-soot"}`}>{tag}</abbr>
                          ))}
                          {it.allergens && <sup className="ml-1.5 font-sans text-[11px] tracking-normal text-muted-foreground">({it.allergens})</sup>}
                        </p>
                        {it.desc && <p className="font-serif-it text-muted-foreground">{it.desc}</p>}
                        {it.extra && <p className="mt-1 text-xs tracking-wider text-ochre/90 uppercase">{l.extra}: {it.extra}</p>}
                      </div>
                      <p className="font-display shrink-0 text-xl text-ochre sm:text-2xl">{it.price} €</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {s.note && <p data-reveal className="reveal gold-frame mt-8 p-5 font-serif-it text-lg text-plaster/90">{l.note}</p>}
          </section>
        ))}

        <section data-reveal className="reveal border border-ochre/40 bg-card p-6" aria-labelledby="allerg">
          <h2 id="allerg" className="font-display text-xl tracking-[0.15em] text-ochre">{l.allergens}</h2>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            {ALLERGENS.map((a) => (
              <div key={a.code} className="flex gap-2"><dt className="w-5 font-bold text-ochre">{a.code}</dt><dd>{allergenLabel(a, lang)}</dd></div>
            ))}
          </dl>
        </section>

        <div className="text-center">
          <Link to="/reservierung" className="btn-shine poster-shadow inline-block border border-ochre/60 bg-blood px-8 py-4 font-display text-2xl text-plaster transition-transform duration-300 hover:-translate-y-1">
            {t("home.ctaBook")}
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}