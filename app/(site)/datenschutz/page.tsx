import type { Metadata } from "next";
import Datenschutz from "./view";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – NEA 1889",
  description: "Informationen zur Verarbeitung personenbezogener Daten gemäß DSGVO bei NEA 1889.",
  openGraph: { title: "Datenschutz – NEA 1889", description: "Datenschutzerklärung nach Art. 13 DSGVO.", type: "website" },
  twitter: { card: "summary" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Datenschutz />;
}
