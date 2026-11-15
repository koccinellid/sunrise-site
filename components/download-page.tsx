import Link from "next/link";
import type { ReactNode } from "react";
import { getLauncherRelease, type LauncherRelease, type ReleaseAsset } from "@/components/github-releases";
import { HorizonScene } from "@/components/horizon-scene";
import { AppleIcon, DownloadIcon, ExternalLinkIcon, LinuxIcon, WindowsIcon } from "@/components/icons";
import { GITHUB_URL } from "@/components/links";

// Every launcher release, also when the newest can't be found: launcher@ releases are never GitHub's latest.
const LAUNCHER_RELEASES = `${GITHUB_URL}/releases?q=launcher&expanded=true`;

const megabytes = (bytes: number) => `${(bytes / 1e6).toFixed(1)} MB`;
const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function FileButton({ asset, primary, children }: { asset: ReleaseAsset; primary?: boolean; children: ReactNode }) {
  const look = primary
    ? "sun-button bg-brand text-white hover:bg-brand-hover"
    : "glass-panel border border-line text-foreground";
  return (
    <a href={asset.url} className={`soft-press inline-flex min-h-11 items-center gap-2.5 rounded-[10px] px-4 py-2 text-[15px] font-medium ${look}`}>
      <DownloadIcon className="size-[17px] shrink-0" />
      <span>
        {children}
        <span className={`block text-xs font-normal ${primary ? "text-white/80" : "text-muted"}`}>
          {asset.name} · {megabytes(asset.size)}
        </span>
      </span>
    </a>
  );
}

function System({ id, icon, name, children }: { id: string; icon: ReactNode; name: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="glass-panel scroll-mt-24 rounded-2xl border border-line p-6 sm:p-7">
      <h2 id={`${id}-title`} className="flex items-center gap-2.5 font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">
        {icon}
        {name}
      </h2>
      <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

function Note({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-lavender px-4 py-3 text-sm leading-relaxed">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}

function Downloads({ launcher }: { launcher: LauncherRelease }) {
  const { windowsSetup, windowsZip, linuxAppImage, linuxTar, macosDmg } = launcher.files;
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <System id="windows" icon={<WindowsIcon className="size-5" />} name="Windows">
        {windowsSetup || windowsZip ? (
          <>
            <div className="flex flex-col gap-2.5">
              {windowsSetup && (
                <FileButton asset={windowsSetup} primary>
                  Installer for Windows
                </FileButton>
              )}
              {windowsZip && <FileButton asset={windowsZip}>ZIP, no installation</FileButton>}
            </div>
            <p>For x64 PCs. The installer needs no administrator rights, and the launcher updates itself from there.</p>
            <Note title="Windows protected your PC">
              The installer isn&apos;t code-signed yet, so SmartScreen may stop it. Choose <strong>More info</strong>, then{" "}
              <strong>Run anyway</strong>.
            </Note>
          </>
        ) : (
          <p>This release has no Windows launcher.</p>
        )}
      </System>

      <System id="linux" icon={<LinuxIcon className="size-5" />} name="Linux">
        {linuxAppImage || linuxTar ? (
          <>
            <div className="flex flex-col gap-2.5">
              {linuxAppImage && (
                <FileButton asset={linuxAppImage} primary>
                  AppImage
                </FileButton>
              )}
              {linuxTar && <FileButton asset={linuxTar}>Archive (.tar.gz)</FileButton>}
            </div>
            <p>
              For x86_64. Make the AppImage executable (<code>chmod +x</code>) and run it, or extract the archive and run the
              launcher in it.
            </p>
          </>
        ) : (
          <p>This release has no Linux launcher.</p>
        )}
      </System>

      <System id="macos" icon={<AppleIcon className="size-5" />} name="macOS">
        {macosDmg ? (
          <>
            <FileButton asset={macosDmg} primary>
              Disk image for Apple Silicon
            </FileButton>
            <p>Apple Silicon (M1 or newer). There is no build for Intel Macs.</p>
            <Note title="macOS can't check the app">
              It isn&apos;t notarized by Apple yet. Open it once, then choose <strong>Open Anyway</strong> in{" "}
              <strong>System Settings, Privacy &amp; Security</strong>.
            </Note>
          </>
        ) : (
          <p>There is no macOS launcher in this release yet. For now Sunrise&apos;s launcher runs on Windows and Linux.</p>
        )}
      </System>
    </div>
  );
}

export async function DownloadPage() {
  const launcher = await getLauncherRelease();
  return (
    <main>
      <section className="relative isolate overflow-hidden">
        <HorizonScene className="absolute inset-0 -z-10" wideSun={{ x: 0.74, scale: 1.5, rise: 0.6 }} />
        <div aria-hidden className="h-18" />
        <div className="mx-auto w-full max-w-6xl px-6 pt-14 pb-16 lg:px-10 lg:pt-24">
          <h1 className="font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-foreground">
            Download Sunrise
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            The launcher installs the game, keeps it up to date and prepares it from your own copy of Minecraft: Java Edition 26.3.{" "}
            <Link href="/docs/install" className="text-accent-ink underline decoration-accent/40 underline-offset-4">
              How to install
            </Link>
          </p>
          {launcher && launcher !== "none" && (
            <p className="mt-4 text-sm text-muted">
              Launcher {launcher.version}
              {launcher.published && <> · {day.format(new Date(launcher.published))}</>} ·{" "}
              <a href={launcher.url} className="inline-flex items-center gap-1 text-accent-ink underline decoration-accent/40 underline-offset-4">
                Release notes
                <ExternalLinkIcon className="size-3.5" />
              </a>
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6 pb-24 lg:px-10">
        {launcher === "none" ? (
          <div className="glass-panel max-w-2xl rounded-2xl border border-line p-7">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">Coming soon</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Sunrise&apos;s first launcher hasn&apos;t been released yet. When it is, its downloads for Windows and Linux appear here.
            </p>
          </div>
        ) : launcher ? (
          <Downloads launcher={launcher} />
        ) : (
          <div className="glass-panel max-w-2xl rounded-2xl border border-line p-7">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">Downloads are on GitHub</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              This page couldn&apos;t reach GitHub just now. The launcher&apos;s releases are listed{" "}
              <a href={LAUNCHER_RELEASES} className="text-accent-ink underline decoration-accent/40 underline-offset-4">
                on GitHub
              </a>
              .
            </p>
          </div>
        )}
        {launcher && launcher !== "none" && (
          <p className="mt-10 text-sm text-muted">
            Every release carries <code>SHA256SUMS</code>, the checksums of its files.{" "}
            <a href={LAUNCHER_RELEASES} className="text-accent-ink underline decoration-accent/40 underline-offset-4">
              All launcher releases
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
