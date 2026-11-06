import type { Metadata } from "next";
import MenuPage from "./view";

export const metadata: Metadata = {
  title: "Menu – NEA 1889 Pizza Napoletana Berlin",
  description: "Antipasti, Pizze Tradizionali 1889, Le Bianche, Pizze Speciali NEA 1889, Dolci und Bevande – AVPN-Ofen, Mehl von Mulino Paolo Mariani.",
  openGraph: { title: "Das Menu von NEA 1889", description: "Neapolitanische Pizza, Antipasti und Dolci in Berlin-Kreuzberg.", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function Page() {
  return <MenuPage />;
}
