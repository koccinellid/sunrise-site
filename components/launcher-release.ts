// Which release is Sunrise's newest launcher, from GitHub's release list (components/github-releases.ts reads it).

// The files of a Sunrise launcher release (launcher.yml on sunrise-org/sunrise). There is no Windows ARM64 or Intel Mac
// build; macOS has a disk image only in releases that carry one.
export const LAUNCHER_FILES = {
  windowsSetup: /^sunrise-launcher-setup\.exe$/,
  windowsZip: /^sunrise-launcher-windows-x64\.zip$/,
  linuxAppImage: /^sunrise-launcher-linux-x86_64\.AppImage$/,
  linuxTar: /^sunrise-launcher-linux-x86_64\.tar\.gz$/,
  macosDmg: /^sunrise-launcher-macos-arm64\.dmg$/,
} as const;
export type LauncherFile = keyof typeof LAUNCHER_FILES;
type Asset = { name: string; size: number; url: string };
export type LauncherRelease = { version: string; url: string; published: string; files: Partial<Record<LauncherFile, Asset>> };
export type ListedRelease = {
  tag_name: string;
  draft: boolean;
  published_at: string | null;
  html_url: string;
  assets: { name: string; size: number; browser_download_url: string }[];
};

const versionParts = (tag: string) => tag.replace(/^launcher@/, "").split(".").map((n) => Number.parseInt(n, 10) || 0);
const newer = (a: number[], b: number[]) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  return false;
};

// The launcher@ release with the highest version that carries Sunrise's launcher files, or null. Launcher releases are
// never GitHub's latest, so /releases/latest can't find them. The launcher@0.2.x tags that came with Horizon's history
// have no releases in Sunrise's repository: a tag-by-tag lookup would walk through them first, the release list skips
// them.
export function newestLauncher(releases: ListedRelease[]): LauncherRelease | null {
  let best: { parts: number[]; release: ListedRelease } | null = null;
  for (const r of releases) {
    if (r.draft || !r.tag_name.startsWith("launcher@")) continue;
    if (!r.assets.some((a) => Object.values(LAUNCHER_FILES).some((re) => re.test(a.name)))) continue;
    const parts = versionParts(r.tag_name);
    if (!best || newer(parts, best.parts)) best = { parts, release: r };
  }
  if (!best) return null;
  const { release } = best;
  const files: LauncherRelease["files"] = {};
  for (const [file, re] of Object.entries(LAUNCHER_FILES) as [LauncherFile, RegExp][]) {
    const asset = release.assets.find((a) => re.test(a.name));
    if (asset) files[file] = { name: asset.name, size: asset.size, url: asset.browser_download_url };
  }
  return { version: release.tag_name.replace(/^launcher@/, ""), url: release.html_url, published: release.published_at ?? "", files };
}
