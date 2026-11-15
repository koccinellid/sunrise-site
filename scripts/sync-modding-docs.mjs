// Copies the modding book (docs/modding/src) of a game checkout into content/docs/modding, at one commit.
//   node scripts/sync-modding-docs.mjs <checkout> <commit> [owner/repo]
// The site has no mdBook, so the copy differs from the source in four ways:
// - {{#include file:anchor}} lines are replaced by the code they name;
// - the tables mdBook's sdk-tables preprocessor generates ({{#sdk-…}}) become a link to the published book;
// - the book's images are copied to public/media/docs/modding;
// - prose says Sunrise where the book says Horizon, and playsunrise.net where it says playhorizon.dev (sunriseNaming
//   below). Code, file, crate and binary names stay;
// - EDITS: the few passages that are about the book's own fork and upstream's registry rather than about Sunrise.
// components/modding-docs.ts turns the copies into pages.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";

const [checkout, rev, repo = "arismoko/horizon"] = process.argv.slice(2);
if (!checkout || !rev) {
  console.error("usage: node scripts/sync-modding-docs.mjs <checkout> <commit> [owner/repo]");
  process.exit(2);
}

const SRC = "docs/modding/src";
const OUT = join(import.meta.dirname, "..", "content", "docs", "modding");
const MEDIA = join(import.meta.dirname, "..", "public", "media", "docs", "modding");
const PUBLISHED = "https://arismoko.github.io/horizon";
const git = (...args) => execFileSync("git", ["-C", checkout, ...args], { encoding: "utf8", maxBuffer: 1 << 28 });

const commit = git("rev-parse", `${rev}^{commit}`).trim();
const show = (path) => git("show", `${commit}:${path}`).replace(/\r\n?/g, "\n");

function include(from, target) {
  const [file, anchor] = target.split(":");
  const path = posix.normalize(posix.join(posix.dirname(from), file));
  const lines = show(path).split("\n");
  if (!anchor) return lines.join("\n").trimEnd();
  const start = lines.findIndex((l) => l.trim().endsWith(`ANCHOR: ${anchor}`));
  const end = lines.findIndex((l) => l.trim().endsWith(`ANCHOR_END: ${anchor}`));
  if (start < 0 || end < start) throw new Error(`${from}: no anchor ${anchor} in ${path}`);
  const body = lines.slice(start + 1, end).filter((l) => !/ANCHOR(_END)?: /.test(l));
  const indent = Math.min(...body.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return body.map((l) => l.slice(indent)).join("\n");
}

// "Horizon" names the game, the launcher or the project in the book's prose; on this site that is Sunrise. Fenced code,
// inline code and link targets are left alone, so `horizon-mod.toml`, `horizon-ctl` and URLs keep their real names.
function sunriseNaming(text) {
  let fence = "";
  return text
    .split("\n")
    .map((line) => {
      const mark = line.match(/^\s*(```|~~~)/)?.[1];
      if (mark && (!fence || fence === mark)) {
        fence = fence ? "" : mark;
        return line;
      }
      if (fence) return line;
      return line
        .split(/(`+[^`]*`+|\]\([^)\s]*\))/)
        .map((part, i) =>
          i % 2
            ? part.startsWith("`")
              ? part
              : part.replace(/#[\w-]*horizon[\w-]*\)$/, (a) => a.replace(/horizon/g, "sunrise")).replace("//playhorizon.dev", "//playsunrise.net")
            : part.replace(/\bHorizon\b/g, "Sunrise").replace(/\bplayhorizon\.dev\b/g, "playsunrise.net"),
        )
        .join("");
    })
    .join("\n");
}

// Each edit must match, so a book that changed under it fails the sync instead of shipping the old wording.
const FORK_NOTE = /^> \*\*This book documents the fork's mod API\.\*\*.*\n\n/m;
const EDITS = {
  "how-to/publish.md": [[FORK_NOTE, ""]],
  "reference/registry-index.md": [
    [FORK_NOTE, ""],
    ["opens a pull request on\n[horizon-rust/horizon-mods](https://github.com/horizon-rust/horizon-mods).", "opens a pull request on\n[sunrise-org/horizon-mods](https://github.com/sunrise-org/horizon-mods)."],
  ],
};

function edit(file, text) {
  for (const [from, to] of EDITS[file] ?? []) {
    if (typeof from === "string" ? !text.includes(from) : !from.test(text)) throw new Error(`${file}: the edit for ${from} matches nothing`);
    text = text.replace(from, to);
  }
  return text;
}

rmSync(OUT, { recursive: true, force: true });
rmSync(MEDIA, { recursive: true, force: true });
const tree = git("ls-tree", "-r", "--name-only", commit, SRC).split("\n");
const files = tree.filter((f) => f.endsWith(".md"));
for (const path of files) {
  const page = path.slice(SRC.length + 1).replace(/\.md$/, ".html");
  // Keep the indentation of the include line on every line it brings in: a block inside a list item stays in it.
  const text = show(path)
    .replace(/^([ \t]*)\{\{#(?:rustdoc_)?include ([^ }]+)\s*\}\}$/gm, (_, pad, target) =>
      include(path, target).split("\n").map((l) => (l ? pad + l : l)).join("\n"),
    )
    .replace(/^\{\{#(sdk-[a-z]+)\}\}$/gm, `This table is generated when the book is built: see it in [the published book](${PUBLISHED}/${page}).`);
  const out = join(OUT, path.slice(SRC.length + 1));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, edit(path.slice(SRC.length + 1), sunriseNaming(text)));
}
const images = tree.filter((f) => f.startsWith(`${SRC}/images/`));
for (const path of images) {
  mkdirSync(MEDIA, { recursive: true });
  writeFileSync(join(MEDIA, posix.basename(path)), sunriseNaming(show(path)));
}
writeFileSync(join(OUT, "source.json"), `${JSON.stringify({ repo, commit, path: SRC }, null, 2)}\n`);
console.log(`${files.length} pages and ${images.length} images from ${repo}@${commit.slice(0, 7)}`);
