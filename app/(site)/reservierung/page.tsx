import type { Metadata } from "next";
import ReservationPage from "./view";

export const metadata: Metadata = {
  title: "Tisch reservieren – NEA 1889 Berlin",
  description: "Reserviere in fünf Schritten deinen Tisch bei NEA 1889 in Berlin-Kreuzberg.",
  openGraph: { title: "Reservierung – NEA 1889", description: "Pranzo oder Cena: in wenigen Klicks zum Tisch.", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function Page() {
  return <ReservationPage />;
}
