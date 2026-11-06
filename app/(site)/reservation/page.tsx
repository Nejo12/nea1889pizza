import type { Metadata } from "next";
import StatusPage from "./view";

// Personal status pages must never be indexed or leak their URL fragment as a referrer.
export const metadata: Metadata = {
  title: "Deine Reservierung – NEA 1889",
  description: "Status deiner Tischanfrage bei NEA 1889 in Berlin-Kreuzberg.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function Page() {
  return <StatusPage />;
}
