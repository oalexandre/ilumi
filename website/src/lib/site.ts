export const SITE_URL = "https://ilumi.oalexandre.com.br";
export const REPO_URL = "https://github.com/oalexandre/ilumi";
export const RELEASES_URL = `${REPO_URL}/releases`;
export const PLUGINS_GUIDE_URL = `${REPO_URL}/blob/master/docs/plugins.md`;
export const DONATE_URL = "https://donate.stripe.com/4gMdRb2RKb4vaNxdZ5aZi00";
export const AUTHOR_URL = "https://oalexandre.com.br";

/** Bump only after the GitHub release for this version is published. */
export const VERSION = "0.3.1";

const DOWNLOAD_BASE = `${RELEASES_URL}/download/v${VERSION}`;

export type OS = "mac" | "windows" | "linux";

export interface Build {
  os: OS;
  label: string;
  detail: string;
  url: string;
}

const FILES: Array<Omit<Build, "url"> & { file: string }> = [
  { os: "mac", label: "macOS", detail: "Apple Silicon · .dmg", file: `Ilumi-${VERSION}-arm64.dmg` },
  { os: "mac", label: "macOS Intel", detail: "Intel · .dmg", file: `Ilumi-${VERSION}-x64.dmg` },
  { os: "windows", label: "Windows", detail: "64-bit · .exe", file: `Ilumi-Setup-${VERSION}-x64.exe` },
  { os: "windows", label: "Windows ARM", detail: "ARM64 · .exe", file: `Ilumi-Setup-${VERSION}-arm64.exe` },
  { os: "linux", label: "Linux", detail: "x64 · .deb", file: `Ilumi_${VERSION}_amd64.deb` },
  { os: "linux", label: "Linux ARM", detail: "ARM64 · .deb", file: `Ilumi_${VERSION}_arm64.deb` },
  { os: "linux", label: "Linux AppImage", detail: "x64 · .AppImage", file: `Ilumi-${VERSION}-x86_64.AppImage` },
  { os: "linux", label: "Linux AppImage ARM", detail: "ARM64 · .AppImage", file: `Ilumi-${VERSION}-arm64.AppImage` },
];

export const BUILDS: Build[] = FILES.map(({ file, ...build }) => ({
  ...build,
  url: `${DOWNLOAD_BASE}/${file}`,
}));

/** The build offered first for each OS. */
export const PRIMARY_BUILD: Record<OS, Build> = {
  mac: BUILDS[0]!,
  windows: BUILDS[2]!,
  linux: BUILDS[4]!,
};

export type Locale = "en" | "pt";

export const LOCALE_PATH: Record<Locale, string> = { en: "/", pt: "/pt/" };
export const LOCALE_TAG: Record<Locale, string> = { en: "en", pt: "pt-BR" };
