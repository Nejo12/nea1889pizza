import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { I18nProvider } from "@/lib/site/i18n";
import "./site.css";

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Search indexing stays off until the Founder authorizes the production cutover (see docs/frontend-migration.md).
export const metadata: Metadata = {
  title: "NEA 1889 – Pizza Napoletana Berlin",
  description: "Neapolitanische Pizza in Berlin-Kreuzberg.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
  icons: { icon: "/site-favicon.png" },
};

export default function SiteRootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700&family=Cinzel:wght@400;600;800&family=Cormorant+Garamond:ital,wght@0,500;1,400;1,600&display=swap"
        />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
