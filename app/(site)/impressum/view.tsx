"use client";

import { SiteLayout } from "@/components/site/SiteChrome";
import { LegalBindingNotice, LegalTranslation } from "@/components/site/LegalTranslation";
import { IMPRESSUM_TR } from "@/lib/site/legal-i18n";


export default function Impressum() {
  return (
    <SiteLayout>
      <article lang="de" className="mx-auto max-w-3xl space-y-6 px-4 py-14 leading-relaxed">
        <h1 className="font-display text-6xl text-plaster">Impressum</h1>
        <LegalBindingNotice />
        <p className="border-3 border-destructive bg-destructive/15 p-3 text-sm font-semibold">
          ENTWURF – Angaben in [Klammern] sind Platzhalter und müssen vom Betreiber ergänzt und rechtlich geprüft werden.
        </p>
        <section>
          <h2 className="font-display text-3xl">Angaben gemäß § 5 DDG (vormals § 5 TMG)</h2>
          <p>[Firmenname / Rechtsform]<br />NEA 1889<br />Zimmerstraße 26/27<br />10969 Berlin</p>
        </section>
        <section>
          <h2 className="font-display text-3xl">Vertreten durch</h2>
          <p>[Geschäftsführer/in]</p>
        </section>
        <section>
          <h2 className="font-display text-3xl">Kontakt</h2>
          <p>Telefon: [Telefonnummer]<br />E-Mail: [E-Mail-Adresse]</p>
        </section>
        <section>
          <h2 className="font-display text-3xl">Registereintrag</h2>
          <p>Registergericht: [Amtsgericht]<br />Registernummer: [HRB …]</p>
        </section>
        <section>
          <h2 className="font-display text-3xl">Umsatzsteuer-ID</h2>
          <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: [DE…]</p>
        </section>
        <section>
          <h2 className="font-display text-3xl">Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)</h2>
          <p>[Name], Anschrift wie oben</p>
        </section>
        <section>
          <h2 className="font-display text-3xl">Verbraucherstreitbeilegung</h2>
          <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
        </section>
        <section>
          <h2 className="font-display text-3xl">Gestaltung</h2>
          <p>Art Direction & Illustration: Saint Gennaro 081 Media Agency Group.</p>
        </section>
        <LegalTranslation docs={IMPRESSUM_TR} />
      </article>
    </SiteLayout>
  );
}
