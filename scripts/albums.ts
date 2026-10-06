// アーティストごとの分類からアルバムの記事を集め、曲目を取り出す。
// アルバムかどうかは「2024年のアルバム」のような年の分類で見分ける。曲目の書き方は
// 曲目表の書式（{{Tracklist}}）と番号付きの箇条書き（#）の二通りを読む
import { readFile, writeFile } from "node:fs/promises";
import { categoriesOf, categoryMembers, wikitext } from "./lib/wiki";

type Artist = { name: string; page: string; categories: string[] };
type Album = { artist: string; title: string; page: string; year: number | null; tracks: string[] };

// 「2024年のアルバム」のほか「2021年のデビュー・アルバム」なども年の手がかりになる
const YEAR_CATEGORY = /^Category:(\d{4})年の(?:[^の]*・)?アルバム$/;

// 映像の特典や DVD の中身は曲目ではない
const SKIP_SECTION = /DVD|Blu-ray|BD|映像|特典映像|Music Video|MV/i;

// 初回盤の小見出しの中に、特典映像の項目が曲と並んで書かれている記事がある
const NOT_A_SONG =
  /^(instrumental|off vocal|カラオケ)|映像|メイキング|Making|ドキュメンタリー|Music Video|Music Clip|Digest|密着|企画|オフショット|Behind|Live Part|鑑賞会|約\d+分|〈MUSIC VIDEO〉/i;

function clean(text: string): string {
  return text
    .replace(/\[\[(?:File|ファイル|画像|Image):[^\]]*\]\]/gi, "")
    .replace(/<ref[^>]*\/>|<ref[^>]*>[\s\S]*?<\/ref>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/'{2,}/g, "")
    .trim();
}

/** 曲名の後ろに付く「 - 作詞…」「（…）」「(Album ver.)」以外の注記を外す */
function titleOf(line: string): string {
  const text = clean(line);
  const quoted = text.match(/^「(.+?)」/);
  if (quoted) return quoted[1].trim();
  return text
    .split(/\s+[-–—]\s+|\s*［|\s*\[|　/)[0]
    // 作詞者などの注記は閉じ括弧が無いこともある
    .replace(/\s*[（(](作詞|作曲|編曲|詞|曲)[^）)]*[）)]?\s*$/, "")
    .replace(/\s*[（(][^（）()]*(収録|のみ|限定|読み)[^（）()]*[）)]\s*$/, "")
    .trim();
}

/** 「収録曲」の節だけを返す。見出しの名前はアルバムによって揺れる */
function trackSection(text: string): string | null {
  const heading = /^(={2,3})\s*(収録曲|曲目|トラックリスト|収録内容)\s*\1\s*$/m.exec(text);
  if (!heading) return null;
  const level = heading[1].length;
  const rest = text.slice(heading.index + heading[0].length);
  const end = new RegExp(`^={2,${level}}[^=]`, "m").exec(rest);
  return end ? rest.slice(0, end.index) : rest;
}

/** 小見出しで区切り、映像の小見出しの中身を落とす */
function withoutVideo(section: string): string {
  return section
    .split(/^(?==+[^=\n]+=+\s*$)/m)
    .filter((part) => {
      const heading = part.match(/^=+([^=\n]+)=+/);
      return !heading || !SKIP_SECTION.test(heading[1]);
    })
    .join("\n");
}

function tracksFromTemplate(section: string): string[] {
  const tracks: string[] = [];
  for (const block of section.matchAll(/\{\{\s*Track ?list(?:ing)?\b([\s\S]*?)\n\}\}/gi)) {
    if (/\|\s*headline\s*=\s*[^\n|]*(DVD|Blu-ray|BD|映像)/i.test(block[1])) continue;
    const titles = [...block[1].matchAll(/\|\s*title(\d+)\s*=\s*([^\n]*)/g)]
      .sort((a, b) => Number(a[1]) - Number(b[1]))
      .map((m) => titleOf(m[2]));
    tracks.push(...titles);
  }
  return tracks;
}

function tracksFromList(section: string): string[] {
  return section
    .split("\n")
    .filter((line) => /^#(?![#:*])/.test(line))
    .map((line) => titleOf(line.replace(/^#\s*/, "")));
}

function tracksOf(text: string): string[] {
  const section = trackSection(text);
  if (!section) return [];
  const body = withoutVideo(section);
  const fromTemplate = tracksFromTemplate(body);
  const tracks = fromTemplate.length > 0 ? fromTemplate : tracksFromList(body);
  // 初回盤と通常盤で曲目を分けて書いた記事があるので、同じ曲名は1つにまとめる
  return [...new Set(tracks.filter((t) => t.length > 0 && !NOT_A_SONG.test(t)))];
}

async function main() {
  const artists: Artist[] = JSON.parse(await readFile("data/raw/artists.json", "utf8"));
  const only = process.argv[2];
  const albums: Album[] = [];

  for (const artist of artists) {
    if (only && artist.name !== only) continue;
    const pages = new Set<string>();
    for (const category of artist.categories) {
      for (const title of await categoryMembers(category)) pages.add(title);
    }
    pages.delete(artist.page);

    let count = 0;
    const categories = await categoriesOf([...pages]);
    for (const title of pages) {
      const cats = categories.get(title) ?? [];
      const yearCategory = cats.map((c) => c.match(YEAR_CATEGORY)).find(Boolean);
      // 「◯◯のアルバム」に入っていればアルバム。名前だけの分類から来た記事は、年のアルバム分類で確かめる
      if (!cats.includes(`Category:${artist.name}のアルバム`) && !yearCategory) continue;
      const page = await wikitext(title);
      if (!page) continue;
      // 分類に入った別名の記事が、同じアルバムの記事へ転送されていることがある
      if (albums.some((a) => a.artist === artist.name && a.page === page.title)) continue;
      const released = page.text.match(/\|\s*(?:Released|発売日?)\s*=[^\n]*?(\d{4})/i);
      const year = yearCategory ? Number(yearCategory[1]) : released ? Number(released[1]) : null;
      albums.push({ artist: artist.name, title: title.replace(/ \([^)]*\)$/, ""), page: page.title, year, tracks: tracksOf(page.text) });
      count++;
    }
    console.error(`${artist.name}: アルバム ${count} 枚`);
  }

  await writeFile(only ? `data/raw/albums-${only}.json` : "data/raw/albums.json", `${JSON.stringify(albums, null, 2)}\n`);
  const empty = albums.filter((a) => a.tracks.length === 0);
  console.error(`アルバム ${albums.length} 枚、曲 ${albums.reduce((n, a) => n + a.tracks.length, 0)} 曲、曲目が取れなかったもの ${empty.length} 枚`);
}

main();
