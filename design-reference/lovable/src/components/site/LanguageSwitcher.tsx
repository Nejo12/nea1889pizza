import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, Check } from "lucide-react";
import { LANGS, LANG_NAMES, useI18n, type Lang } from "@/lib/i18n";
import { Flag } from "./Flags";

/** Desktop: animated flag dropdown (listbox pattern, full keyboard support). */
export function LanguageDropdown() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    listRef.current?.focus();
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openList = () => {
    setActive(LANGS.indexOf(lang));
    setOpen(true);
  };
  const choose = (l: Lang) => {
    setLang(l);
    setOpen(false);
    btnRef.current?.focus();
  };

  const onListKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % LANGS.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + LANGS.length) % LANGS.length); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(LANGS.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(LANGS[active] ?? lang); }
    else if (e.key === "Escape" || e.key === "Tab") { setOpen(false); if (e.key === "Escape") btnRef.current?.focus(); }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={`${t("lang")}: ${LANG_NAMES[lang]}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(e) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); openList(); } }}
        className={`group flex h-11 items-center gap-2.5 border px-3 font-display text-sm tracking-[0.2em] text-plaster transition-[border-color,background-color,box-shadow] duration-300 ease-out hover:border-ochre hover:bg-ochre/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ochre ${open ? "border-ochre bg-ochre/10 shadow-[0_0_24px_-6px_var(--ochre)]" : "border-ochre/50"}`}
      >
        <span key={lang} className="lang-pop flex items-center gap-2.5">
          <Flag lang={lang} />
          <span>{lang.toUpperCase()}</span>
        </span>
        <ChevronDown aria-hidden className={`h-4 w-4 text-ochre transition-transform duration-500 ease-[cubic-bezier(.2,.9,.3,1.3)] ${open ? "rotate-180" : ""}`} />
      </button>

      <ul
        ref={listRef}
        id={`${id}-list`}
        role="listbox"
        tabIndex={-1}
        aria-label={t("lang")}
        aria-activedescendant={open ? `${id}-${LANGS[active]}` : undefined}
        onKeyDown={onListKey}
        data-open={open}
        className="lang-panel absolute top-[calc(100%+10px)] right-0 z-50 w-52 origin-top-right border border-ochre/60 bg-soot/95 p-1.5 shadow-[0_24px_50px_-12px_rgb(0_0_0/0.8)] backdrop-blur-md outline-none"
      >
        <span aria-hidden className="absolute -top-[6px] right-5 h-2.5 w-2.5 rotate-45 border-t border-l border-ochre/60 bg-soot" />
        {LANGS.map((l, i) => {
          const selected = l === lang;
          return (
            <li
              key={l}
              id={`${id}-${l}`}
              role="option"
              aria-selected={selected}
              lang={l}
              style={{ ["--i" as string]: i }}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(l)}
              className={`lang-item relative flex min-h-11 cursor-pointer items-center gap-3 px-3 transition-colors duration-200 ${i === active ? "bg-ochre/15" : ""}`}
            >
              <span aria-hidden className={`absolute inset-y-2 left-0 w-0.5 bg-ochre transition-transform duration-300 ${i === active ? "scale-y-100" : "scale-y-0"}`} />
              <Flag lang={l} className={`transition-transform duration-300 ${i === active ? "scale-110" : ""}`} />
              <span className={`font-display text-sm tracking-[0.2em] ${selected ? "text-ochre" : "text-plaster"}`}>{l.toUpperCase()}</span>
              <span className="font-serif-it text-sm text-muted-foreground">{LANG_NAMES[l]}</span>
              {selected && <Check aria-hidden className="ml-auto h-4 w-4 text-ochre" />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Mobile drawer: 3×2 grid of flag tiles with a gliding gold selection frame. */
export function LanguageTiles() {
  const { lang, setLang, t } = useI18n();
  const idx = LANGS.indexOf(lang);
  return (
    <div role="radiogroup" aria-label={t("lang")} className="relative grid grid-cols-3 gap-2">
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 h-[calc((100%-0.5rem)/2)] w-[calc((100%-1rem)/3)] border border-ochre bg-ochre/15 shadow-[0_0_20px_-6px_var(--ochre)] transition-transform duration-500 ease-[cubic-bezier(.2,.9,.3,1.15)] motion-reduce:transition-none"
        style={{ transform: `translate(calc(${idx % 3} * (100% + 0.5rem)), calc(${Math.floor(idx / 3)} * (100% + 0.5rem)))` }}
      />
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={l === lang}
          aria-label={LANG_NAMES[l]}
          lang={l}
          onClick={() => setLang(l)}
          className="relative flex min-h-12 items-center justify-center gap-2 border border-ochre/25 font-display text-sm tracking-[0.2em] transition-[color,transform] duration-200 active:scale-95"
        >
          <Flag lang={l} />
          <span className={l === lang ? "text-ochre" : "text-plaster"}>{l.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}