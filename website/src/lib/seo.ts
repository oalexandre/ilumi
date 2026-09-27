import type { Metadata } from "next";

import { content } from "./content";
import { CLIP_SIZE, mediaPath } from "./scenes";
import { AUTHOR_URL, LOCALE_PATH, LOCALE_TAG, RELEASES_URL, REPO_URL, SITE_URL, VERSION, type Locale } from "./site";

const OG_SIZE = { width: 1200, height: 630 };

export function localeUrl(locale: Locale): string {
  return new URL(LOCALE_PATH[locale], SITE_URL).toString();
}

export function buildMetadata(locale: Locale): Metadata {
  const { meta } = content[locale];
  const og = `/og-${locale}.png`;
  return {
    metadataBase: new URL(SITE_URL),
    title: meta.title,
    description: meta.description,
    applicationName: "Ilumi",
    authors: [{ name: "Alexandre", url: AUTHOR_URL }],
    alternates: {
      canonical: LOCALE_PATH[locale],
      languages: {
        en: LOCALE_PATH.en,
        "pt-BR": LOCALE_PATH.pt,
        "x-default": LOCALE_PATH.en,
      },
    },
    openGraph: {
      type: "website",
      url: LOCALE_PATH[locale],
      siteName: "Ilumi",
      title: meta.title,
      description: meta.description,
      locale: locale === "pt" ? "pt_BR" : "en_US",
      alternateLocale: locale === "pt" ? ["en_US"] : ["pt_BR"],
      images: [{ url: og, ...OG_SIZE, alt: meta.ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [{ url: og, alt: meta.ogAlt }],
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "32x32" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    formatDetection: { telephone: false },
  };
}

/** schema.org data for search results: the app itself and the page's FAQ. */
export function structuredData(locale: Locale): object[] {
  const c = content[locale];
  const url = localeUrl(locale);
  const screenshots = (["groceries", "trip", "invoice", "dev", "dates"] as const).map((id) => ({
    "@type": "ImageObject",
    url: new URL(mediaPath(locale, id, "webp"), SITE_URL).toString(),
    width: CLIP_SIZE.width,
    height: CLIP_SIZE.height,
  }));
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Ilumi",
      url,
      description: c.meta.description,
      inLanguage: LOCALE_TAG[locale],
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "macOS, Windows, Linux",
      softwareVersion: VERSION,
      downloadUrl: RELEASES_URL,
      codeRepository: REPO_URL,
      license: "https://opensource.org/licenses/MIT",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: { "@type": "Person", name: "Alexandre", url: AUTHOR_URL },
      screenshot: screenshots,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: LOCALE_TAG[locale],
      mainEntity: c.faq.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}
