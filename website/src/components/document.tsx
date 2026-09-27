import "@/app/globals.css";

import { inter, mono } from "@/lib/fonts";
import { structuredData } from "@/lib/seo";
import { LOCALE_TAG, type Locale } from "@/lib/site";

/** The <html> shell shared by both language roots, so each page ships its own lang. */
export function Document({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <html lang={LOCALE_TAG[locale]} className={`${inter.variable} ${mono.variable}`}>
      <body>
        {children}
        {structuredData(locale).map((data, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
          />
        ))}
      </body>
    </html>
  );
}
