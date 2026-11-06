import type { Metadata } from "next";
import Impressum from "./view";

export const metadata: Metadata = {
  title: "Impressum – NEA 1889",
  description: "Impressum und Anbieterkennzeichnung von NEA 1889, Berlin.",
  openGraph: { title: "Impressum – NEA 1889", description: "Anbieterkennzeichnung gemäß § 5 DDG.", type: "website" },
  twitter: { card: "summary" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Impressum />;
}
