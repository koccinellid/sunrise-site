import assert from "node:assert/strict";
import { test } from "node:test";
import { newestLauncher, type ListedRelease } from "./launcher-release.ts";

const release = (tag: string, names: string[], draft = false): ListedRelease => ({
  tag_name: tag,
  draft,
  published_at: "2026-11-15T12:00:00Z",
  html_url: `https://github.com/o/r/releases/tag/${tag}`,
  assets: names.map((name) => ({ name, size: 1, browser_download_url: `https://example.com/${tag}/${name}` })),
});

const SUNRISE = ["sunrise-launcher-setup.exe", "sunrise-launcher-windows-x64.zip", "sunrise-launcher-linux-x86_64.tar.gz", "sunrise-launcher-linux-x86_64.AppImage"];

test("the highest launcher version with Sunrise's files wins, whatever the list's order", () => {
  const found = newestLauncher([
    release("nightly", ["sunrise-launcher-setup.exe"]),
    release("launcher@0.1.9", SUNRISE),
    release("launcher@0.2.37", ["horizon-launcher-setup.exe"]),
    release("launcher@0.1.10", SUNRISE),
    release("launcher@0.1.11", SUNRISE, true),
  ]);
  assert.equal(found?.version, "0.1.10");
  assert.deepEqual(Object.keys(found!.files).sort(), ["linuxAppImage", "linuxTar", "windowsSetup", "windowsZip"]);
  assert.equal(found!.files.macosDmg, undefined);
  assert.equal(found!.files.windowsSetup!.url, "https://example.com/launcher@0.1.10/sunrise-launcher-setup.exe");
});

test("no launcher release with Sunrise's files is none", () => {
  assert.equal(newestLauncher([]), null);
  assert.equal(newestLauncher([release("launcher@0.2.17", ["horizon-launcher-linux-x86_64.tar.gz"]), release("v2026.10.18.1", SUNRISE)]), null);
});

test("a macOS disk image is offered only when the release has one", () => {
  const found = newestLauncher([release("launcher@0.1.0", [...SUNRISE, "sunrise-launcher-macos-arm64.dmg", "sunrise-launcher-macos-arm64.zip"])]);
  assert.equal(found?.files.macosDmg?.name, "sunrise-launcher-macos-arm64.dmg");
});
