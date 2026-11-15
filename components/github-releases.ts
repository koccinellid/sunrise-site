import { cacheLife, cacheTag } from "next/cache";
import { TAGS } from "@/components/github-fresh";
import { GAME_REPO } from "@/components/game-repo";
import { githubFetch } from "@/components/github-api";
import { GITHUB_URL } from "@/components/links";
import { newestLauncher, type LauncherRelease } from "@/components/launcher-release";

export { LAUNCHER_FILES, type LauncherFile, type LauncherRelease } from "@/components/launcher-release";
// "none": GitHub answered and no launcher release has Sunrise's files yet; null: GitHub couldn't be read.
export type LauncherLookup = LauncherRelease | "none" | null;
const LAUNCHER_PAGES = 3;

const REPO = GAME_REPO;

export const RELEASES_URL = `${GITHUB_URL}/releases`;

export const RELEASE_LIMIT = 40;

export type ReleaseKind = "horizon" | "launcher" | "nightly";
export type ReleaseAsset = { name: string; size: number; url: string };
export type Release = {
  id: number;
  tag: string;
  title: string;
  kind: ReleaseKind;
  published: string;
  url: string;
  notes: string;
  notesHtml: string;
  assets: ReleaseAsset[];
};

type GitHubRelease = {
  id: number;
  tag_name: string;
  name: string | null;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  html_url: string;
  body?: string | null;
  body_html?: string;
  assets: { name: string; size: number; browser_download_url: string }[];
};

const kindOf = (r: GitHubRelease): ReleaseKind =>
  r.tag_name.startsWith("launcher@") ? "launcher" : r.prerelease || r.tag_name.startsWith("nightly") ? "nightly" : "horizon";

export async function getReleases(): Promise<Release[] | null> {
  "use cache";
  cacheTag(TAGS.releases);
  let releases: GitHubRelease[];
  try {
    const res = await githubFetch(`/repos/${REPO}/releases?per_page=${RELEASE_LIMIT + 10}`, { full: true });
    if (!res.ok) throw new Error(`GitHub responded ${res.status} ${res.statusText}`);
    releases = await res.json();
  } catch (error) {
    console.error(`Couldn't load releases for ${REPO}:`, error);
    cacheLife("minutes");
    return null;
  }

  cacheLife({ stale: 300, revalidate: 900, expire: 86400 });
  return releases
    .filter((r): r is GitHubRelease & { published_at: string } => !r.draft && r.published_at !== null)
    .sort((a, b) => b.published_at.localeCompare(a.published_at))
    .slice(0, RELEASE_LIMIT)
    .map((r) => ({
      id: r.id,
      tag: r.tag_name,
      title: r.name || r.tag_name,
      kind: kindOf(r),
      published: r.published_at,
      url: r.html_url,
      notes: r.body ?? "",
      notesHtml: r.body_html ?? "",
      assets: r.assets.map((a) => ({ name: a.name, size: a.size, url: a.browser_download_url })),
    }));
}

export type DesktopOs = "windows" | "macos" | "linux";
// A system's own launcher build: the OS, or an OS on its other processor (Intel Macs, Windows on ARM).
export type LauncherTarget = DesktopOs | "macos-x64" | "windows-arm64";
export type LauncherBuild = { version: string; files: Partial<Record<LauncherTarget, { url: string; size: number }>> };

// The newest launcher (components/launcher-release.ts) among the repository's newest releases.
export async function getLauncherRelease(): Promise<LauncherLookup> {
  "use cache";
  cacheTag(TAGS.releases);
  const releases: GitHubRelease[] = [];
  try {
    for (let page = 1; page <= LAUNCHER_PAGES; page++) {
      const res = await githubFetch(`/repos/${REPO}/releases?per_page=100&page=${page}`);
      if (!res.ok) throw new Error(`GitHub responded ${res.status} ${res.statusText}`);
      const batch: GitHubRelease[] = await res.json();
      releases.push(...batch);
      if (batch.length < 100) break;
    }
  } catch (error) {
    console.error(`Couldn't find the newest launcher release of ${REPO}:`, error);
    cacheLife("minutes");
    return null;
  }
  cacheLife({ stale: 300, revalidate: 900, expire: 86400 });
  return newestLauncher(releases) ?? "none";
}

// The download buttons' builds. Windows gets the per-user setup: it installs into %LOCALAPPDATA%, where the launcher
// can update itself (a copy run from inside a ZIP or a protected folder can't, horizon#9287). Linux gets the AppImage,
// one file to run, or the archive when a release has no AppImage.
export function launcherBuild(launcher: LauncherLookup): LauncherBuild | null {
  if (!launcher || launcher === "none") return null;
  const { windowsSetup, linuxAppImage, linuxTar, macosDmg } = launcher.files;
  const files: LauncherBuild["files"] = {};
  for (const [target, asset] of [["windows", windowsSetup], ["linux", linuxAppImage ?? linuxTar], ["macos", macosDmg]] as const) {
    if (asset) files[target] = { url: asset.url, size: asset.size };
  }
  return { version: launcher.version, files };
}

// The launcher's files, as published on every release (its own launcher@ releases, and the game releases that carried
// it before them); not the game's files, SHA256SUMS or signatures.
const LAUNCHER_ASSET = /^(horizon|sunrise)-launcher-((windows|linux|macos)-[\w.-]+\.(zip|tar\.gz|dmg|AppImage)|setup(-arm64)?\.exe)$/;
const MAX_RELEASE_PAGES = 10;

// The launcher's downloads over all releases (GitHub's download counts, so self-updates count too), or null when
// GitHub can't be read: callers hide the number then. Every page of releases is read on the server, through Kira's
// proxy (components/github-api.ts), and kept half an hour; a release refreshes it through the releases tag.
export async function getLauncherDownloads(): Promise<number | null> {
  "use cache";
  cacheTag(TAGS.releases);
  let total = 0;
  try {
    for (let page = 1; page <= MAX_RELEASE_PAGES; page++) {
      const res = await githubFetch(`/repos/${REPO}/releases?per_page=100&page=${page}`);
      if (!res.ok) throw new Error(`GitHub responded ${res.status} ${res.statusText}`);
      const batch: { assets: { name: string; download_count: number }[] }[] = await res.json();
      for (const r of batch) for (const a of r.assets) if (LAUNCHER_ASSET.test(a.name)) total += a.download_count;
      if (batch.length < 100) break;
    }
  } catch (error) {
    console.error(`Couldn't count the launcher's downloads for ${REPO}:`, error);
    cacheLife("minutes");
    return null;
  }
  cacheLife({ stale: 300, revalidate: 1800, expire: 86400 });
  return total > 0 ? total : null;
}
