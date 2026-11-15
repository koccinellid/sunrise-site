// Turns the copy of the modding book in content/docs/modding (scripts/sync-modding-docs.mjs) into docs pages:
// mdBook's parts become nav groups, a page `X.md` with a folder `X/` beside it gets that folder's pages as its
// chapters (tools/modding_concept_pages.py in the game's repository), and the book's relative links become site paths
// with this site's heading ids.
import { posix } from "node:path";
import { slug as siteSlug } from "./docs-markdown.ts";

export type BookSource = { repo: string; commit: string; path: string };
export type BookPage = { slug: string; file: string; title: string; text: string; parent: string | null };
export type BookGroup = { group: string; pages: string[] };
export type Book = { groups: BookGroup[]; pages: Map<string, BookPage>; parents: Record<string, string> };

// Each page directly in one of these folders joins the part, after the pages SUMMARY.md lists, in title order.
const FOLDERS: Record<string, string> = { Concepts: "concepts", "How-to": "how-to" };
// Older chapter sources start with these markers; their first heading may be deeper than level 1.
const MARKERS = /^(?:<!-- (?:chapter|separator): .+ -->\n)+\n?/;
const SECTION_PAGES = "<!-- section-pages -->";
const LINK = /(!?\[[^\]\n]*\]\()([^)\s]+)(\))/g;
const IMAGE = /^!\[([^\]]*)\]\((?:\.\.\/)*images\/([\w.-]+)\)$/gm;

const fileSlug = (file: string) =>
  file === "introduction.md" ? "modding" : `modding/${file.replace(/\.md$/, "").replace(/(^|\/)\d+-/g, "$1")}`;

// Runs `change` on every line outside a fenced code block.
function outsideFences(text: string, change: (line: string) => string) {
  let fence = "";
  return text
    .split("\n")
    .map((line) => {
      const mark = line.match(/^\s*(```|~~~)/)?.[1];
      if (mark && (!fence || fence === mark)) {
        fence = fence ? "" : mark;
        return line;
      }
      return fence ? line : change(line);
    })
    .join("\n");
}

type Heading = { level: number; book: string; site: string };

// A page's headings with mdBook's id and the id docs-markdown.ts gives the same heading (levels 2 to 4 only).
function headings(text: string): Heading[] {
  const out: Heading[] = [];
  const counts = new Map<string, number>();
  outsideFences(text, (line) => {
    const m = line.match(/^(#{1,6})\s+(.*?)\s*#*$/);
    if (!m) return line;
    const base = m[2].toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu, "").replace(/ /g, "-");
    const n = counts.get(base) ?? 0;
    counts.set(base, n + 1);
    let site = "";
    if (m[1].length >= 2 && m[1].length <= 4) {
      site = siteSlug(m[2]);
      for (let i = 2; out.some((h) => h.site === site); i++) site = `${siteSlug(m[2])}-${i}`;
    }
    out.push({ level: m[1].length, book: n ? `${base}-${n}` : base, site });
    return line;
  });
  return out;
}

// A page starts with its title at level 1: a source whose first heading is deeper is lifted, the rest of its
// headings with it (never above level 2). The book's HTML (the lede paragraph, the cards' wrapper) is unwrapped, and
// each image is one line pointing at its copy under /media.
function page(raw: string, file: string) {
  let body = raw.replace(/\r\n?/g, "\n").replace(MARKERS, "");
  const first = body.match(/^(#{1,6}) (.+)$/m);
  const title = first?.[2] ?? posix.basename(file, ".md");
  if (first && first.index === 0) body = body.slice(first[0].length).replace(/^\n+/, "");
  const shift = (first?.[1].length ?? 1) - 1;
  if (shift) body = outsideFences(body, (line) => line.replace(/^#{2,6}(?= )/, (h) => "#".repeat(Math.max(2, h.length - shift))));
  body = body
    .replace(/<p class="lede">([\s\S]*?)<\/p>/, "$1")
    .replace(/!\[([^\]]*)\]\(((?:\.\.\/)*images\/[\w.-]+)\)/g, (_, alt: string, src: string) => `![${alt.replace(/\s*\n\s*/g, " ")}](${src})`)
    .replace(IMAGE, (_, alt: string, name: string) => `![${alt}](/media/docs/modding/${name})`);
  return { title, text: `# ${title}\n\n${body}` };
}

export function book(files: Record<string, string>, source: BookSource): Book {
  const byFile = new Map<string, BookPage>();
  for (const [file, raw] of Object.entries(files)) {
    if (!file.endsWith(".md") || file === "SUMMARY.md") continue;
    const { title, text } = page(raw, file);
    byFile.set(file, { slug: fileSlug(file), file, title: title.replace(/`/g, ""), text, parent: null });
  }
  const slugs = new Map<string, string>();
  for (const p of byFile.values()) {
    if (slugs.has(p.slug)) throw new Error(`${p.file} and ${slugs.get(p.slug)} have the same address, /docs/${p.slug}`);
    slugs.set(p.slug, p.file);
  }

  // A page's chapters: the pages of the folder of the same name, in file name order.
  const children = new Map<string, BookPage[]>();
  const parents: Record<string, string> = {};
  for (const p of byFile.values()) {
    const owner = byFile.get(`${posix.dirname(p.file)}.md`);
    if (!owner) continue;
    p.parent = owner.slug;
    parents[p.slug] = owner.slug;
    children.set(owner.file, [...(children.get(owner.file) ?? []), p]);
  }
  for (const list of children.values()) list.sort((a, b) => a.file.localeCompare(b.file));
  for (const [file, list] of children) {
    const owner = byFile.get(file)!;
    const links = list.map((c) => `- [${c.title}](${posix.relative(posix.dirname(file), c.file)})`).join("\n");
    owner.text = owner.text.includes(SECTION_PAGES)
      ? owner.text.replace(SECTION_PAGES, links)
      : `${owner.text.trimEnd()}\n\n## Chapters\n\n${links}\n`;
  }

  const ids = new Map<BookPage, Heading[]>();
  const idsOf = (p: BookPage) => ids.get(p) ?? ids.set(p, headings(p.text)).get(p)!;
  const blob = (path: string) => `https://github.com/${source.repo}/blob/${source.commit}/${path}`;

  function link(from: BookPage, url: string) {
    if (/^([a-z][a-z0-9+.-]*:|\/)/i.test(url)) return url;
    const [path, anchor = ""] = url.split("#");
    const file = path ? posix.normalize(posix.join(posix.dirname(from.file), path)) : from.file;
    const target = path ? byFile.get(file) : from;
    if (!target) {
      // A chapter mdBook generates at build time has no source page: send the reader to the book's folder.
      const inBook = !file.startsWith("../") && file.endsWith(".md");
      return inBook ? `https://github.com/${source.repo}/tree/${source.commit}/${source.path}` : blob(posix.normalize(posix.join(source.path, file))) + (anchor ? `#${anchor}` : "");
    }
    const id = anchor && idsOf(target).find((h) => h.book === anchor)?.site;
    return (target === from && id ? "" : `/docs/${target.slug}`) + (id ? `#${id}` : "");
  }

  const pages = new Map<string, BookPage>();
  for (const p of byFile.values()) {
    pages.set(p.slug, { ...p, text: outsideFences(p.text, (line) => line.replace(LINK, (_, a, url, b) => a + link(p, url) + b)) });
  }

  // SUMMARY.md: "# Part" lines and "[Title](file)" entries; an entry with no file is a generated chapter.
  const groups: BookGroup[] = [{ group: "Modding book", pages: [] }];
  const listed = new Set<string>();
  for (const line of (files["SUMMARY.md"] ?? "").split("\n")) {
    const part = line.match(/^# (.+)$/)?.[1];
    if (part && part !== "Summary") groups.push({ group: part, pages: [] });
    const file = line.match(/^(?:- )?\[[^\]]+\]\(([^)]+)\)/)?.[1];
    if (file && byFile.has(file)) {
      groups.at(-1)!.pages.push(file);
      listed.add(file);
    }
  }
  for (const g of groups) {
    const folder = FOLDERS[g.group];
    if (!folder) continue;
    const rest = [...byFile.values()]
      .filter((p) => !p.parent && !listed.has(p.file) && posix.dirname(p.file) === folder)
      .sort((a, b) => a.title.localeCompare(b.title));
    g.pages.push(...rest.map((p) => p.file));
  }
  // The first part ("Getting started") joins the introduction; one-page parts close the book together.
  const [intro, ...parts] = groups;
  const merged: BookGroup[] = [];
  const tail: BookGroup = { group: "About the book", pages: [] };
  for (const g of parts) {
    if (g === parts[0]) merged.push({ group: "Modding book", pages: [...intro.pages, ...g.pages] });
    else if (g.pages.length === 1 && !FOLDERS[g.group]) tail.pages.push(...g.pages);
    else merged.push(g);
  }
  if (tail.pages.length) merged.push(tail);
  // Each page is followed by its chapters, so the order of the list is the reading order.
  const withChildren = (file: string): string[] => [byFile.get(file)!.slug, ...(children.get(file) ?? []).flatMap((c) => withChildren(c.file))];
  return { groups: merged.filter((g) => g.pages.length).map((g) => ({ group: g.group, pages: g.pages.flatMap(withChildren) })), pages, parents };
}
