import type { Metadata } from "next";
import Home from "./view";

export const metadata: Metadata = {
  title: "NEA 1889 – Neapolitanische Pizza in Berlin-Kreuzberg",
  description: "Pizza napoletana mit 72 Stunden Teigführung. Zimmerstraße 26/27, 10969 Berlin. Jetzt Tisch reservieren.",
  openGraph: { title: "NEA 1889 – Napoli in Berlin", description: "72 Ore Teig, Ofen aus Neapel, Kreuzberger Seele. Reserviere deinen Tisch.", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function Page() {
  return <Home />;
}
