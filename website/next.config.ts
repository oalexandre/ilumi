import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // The website is its own npm project inside the pnpm monorepo.
  outputFileTracingRoot: import.meta.dirname,
  // /pt/ is exported as pt/index.html; canonical URLs and hreflang use the trailing slash.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
