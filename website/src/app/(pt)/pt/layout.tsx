import type { Metadata, Viewport } from "next";

import { Document } from "@/components/document";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("pt");

export const viewport: Viewport = { themeColor: "#0b0a12", colorScheme: "dark" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Document locale="pt">{children}</Document>;
}
