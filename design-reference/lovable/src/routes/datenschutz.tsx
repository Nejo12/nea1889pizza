import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteChrome";
import { LegalBindingNotice, LegalTranslation } from "@/components/site/LegalTranslation";
import { DATENSCHUTZ_TR } from "@/lib/legal-i18n";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [
      { title: "Datenschutzerklärung – NEA 1889" },
      { name: "description", content: "Informationen zur Verarbeitung personenbezogener Daten gemäß DSGVO bei NEA 1889." },
      { property: "og:title", content: "Datenschutz – NEA 1889" },
      { property: "og:description", content: "Datenschutzerklärung nach Art. 13 DSGVO." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Datenschutz,
});

const H = ({ children }: { children: React.ReactNode }) => <h2 className="font-display text-3xl">{children}</h2>;

function Datenschutz() {
  return (
    <SiteLayout>
      <article lang="de" className="mx-auto max-w-3xl space-y-6 px-4 py-14 leading-relaxed">
        <h1 className="font-display text-6xl text-plaster">Datenschutz</h1>
        <LegalBindingNotice />
        <p className="border-3 border-destructive bg-destructive/15 p-3 text-sm font-semibold">
          ENTWURF – vor Veröffentlichung durch den Betreiber zu vervollständigen und rechtlich zu prüfen (Hosting-Anbieter,
          Reservierungssystem, E-Mail-Versand).
        </p>
        <section><H>1. Verantwortlicher</H>
          <p>[Firmenname], Zimmerstraße 26/27, 10969 Berlin, E-Mail: [E-Mail-Adresse].</p></section>
        <section><H>2. Hosting & Server-Logfiles</H>
          <p>Beim Aufruf der Website verarbeitet unser Hosting-Anbieter [Name, Sitz] technisch notwendige Daten (IP-Adresse,
            Zeitpunkt, aufgerufene Seite, Browser). Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (sicherer Betrieb).
            Speicherdauer: [x] Tage.</p></section>
        <section><H>3. Online-Reservierung</H>
          <p>Für Tischreservierungen verarbeiten wir Name, E-Mail, Telefonnummer, Personenzahl, Datum/Uhrzeit sowie freiwillige
            Hinweise. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung). Freiwillige Angaben zu Allergien
            (ggf. Gesundheitsdaten) verarbeiten wir nur mit Ihrer Einwilligung, Art. 9 Abs. 2 lit. a DSGVO.
            Löschung: [x] Tage nach dem Besuch, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.</p></section>
        <section><H>4. Cookies & Tracking</H>
          <p>Diese Website setzt derzeit keine Tracking- oder Marketing-Cookies. Technisch notwendige lokale Speicherung erfolgt
            nach § 25 Abs. 2 TDDDG.</p></section>
        <section><H>5. Externe Links</H>
          <p>Bei Klick auf Links zu Google Maps oder Instagram gelten die Datenschutzbestimmungen der jeweiligen Anbieter.</p></section>
        <section><H>6. Ihre Rechte</H>
          <p>Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18),
            Datenübertragbarkeit (Art. 20), Widerspruch (Art. 21) und Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO).
            Beschwerden können Sie an die Berliner Beauftragte für Datenschutz und Informationsfreiheit richten.</p></section>
        <p className="text-sm text-muted-foreground">Stand: [Datum]</p>
        <LegalTranslation docs={DATENSCHUTZ_TR} />
      </article>
    </SiteLayout>
  );
}