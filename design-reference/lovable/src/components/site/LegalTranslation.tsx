import { useI18n } from "@/lib/i18n";
import type { LegalDoc } from "@/lib/legal-i18n";

/** Banner + informational translation shown under the binding German legal text. */
export function LegalBindingNotice() {
  const { lang, t } = useI18n();
  if (lang === "de") return null;
  return (
    <p lang={lang} className="border border-ochre/60 bg-ochre/10 p-3 text-sm">
      {t("legal.binding")} <a href="#translation" className="text-ochre underline underline-offset-4">↓ {t("legal.trTitle")}</a>
    </p>
  );
}

export function LegalTranslation({ docs }: { docs: Record<string, LegalDoc> }) {
  const { lang, t } = useI18n();
  if (lang === "de") return null;
  const doc = docs[lang];
  if (!doc) return null;
  return (
    <section id="translation" lang={lang} className="mt-12 scroll-mt-24 border-t border-ochre/40 pt-8">
      <details open className="group">
        <summary className="min-h-11 cursor-pointer font-display text-2xl text-ochre">{t("legal.trTitle")}</summary>
        <p className="mt-2 text-sm font-semibold">{t("legal.binding")}</p>
        <div className="mt-4 space-y-5 text-plaster/90">
          <p className="text-sm text-muted-foreground">{doc.draft}</p>
          {doc.sections.map(([h, body]) => (
            <div key={h}>
              <h3 className="font-display text-xl">{h}</h3>
              <p className="whitespace-pre-line">{body}</p>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}