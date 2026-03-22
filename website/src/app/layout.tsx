import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const SITE_URL = "https://ilumi.oalexandre.com.br";
const TITLE = "Ilumi — A Smart Calculator";
const DESCRIPTION =
  "Notepad-style calculator with variables, unit conversions, percentages, date math, base conversions, and plugins. Available for macOS, Windows, and Linux.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  keywords: [
    "calculator",
    "notepad calculator",
    "unit converter",
    "percentage calculator",
    "date calculator",
    "hex converter",
    "developer tools",
    "macOS app",
    "Windows app",
    "Linux app",
    "open source calculator",
  ],
  authors: [{ name: "Alexandre", url: "https://oalexandre.com.br" }],
  creator: "Alexandre",
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Ilumi",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Ilumi Calculator",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/icon-512.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Ilumi",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "macOS, Windows, Linux",
  description: DESCRIPTION,
  url: SITE_URL,
  downloadUrl: "https://github.com/oalexandre/ilumi/releases",
  author: {
    "@type": "Person",
    name: "Alexandre",
    url: "https://oalexandre.com.br",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  softwareVersion: "0.1.1",
  license: "https://opensource.org/licenses/MIT",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-[family-name:var(--font-inter)] min-h-screen">
        {children}
      </body>
    </html>
  );
}
