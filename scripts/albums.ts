// アーティストごとの分類からアルバムとシングルの記事を集め、曲目を取り出す。
// アルバムかどうかは「2024年のアルバム」、シングルかどうかは「1998年のシングル」のような年の分類で見分ける。
// シングルは「◯◯の楽曲」、ベスト盤は「◯◯のベスト・アルバム」のような下位の分類にあるので、
// アーティスト名で始まる下位の分類を1段だけ辿る。曲目の書き方は
// 曲目表の書式（{{Tracklist}}）と番号付きの箇条書き（#）の二通りを読む。
// すでに data/raw/albums.json にある記事は、前の結果をそのまま残す。Notion の行は曲順で結び付いているので、
// 読み方を変えて曲目がずれると、notion:import が同じ曲の行を別に作ってしまう
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { categoriesOf, categoryMembers, wikitext } from './lib/wiki';

type Artist = { name: string; page: string; categories: string[] };
type Album = {
  artist: string;
  title: string;
  page: string;
  year: number | null;
  /** 無いものは、シングルを集める前に入れたアルバム */
  kind?: 'album' | 'single';
  tracks: string[];
};

// 「2024年のアルバム」のほか「2021年のデビュー・アルバム」なども年の手がかりになる
const YEAR_CATEGORY = /^Category:(\d{4})年の(?:[^の]*・)?アルバム$/;
// 「2006年のデビュー・シングル」「2016年のダブルA面シングル」「2020年の配信限定シングル」なども
// 年のシングル分類が無く、「2024年のオリコンシングルチャート1位獲得作品」だけが付いた記事もある
const SINGLE_CATEGORY = /^Category:(\d{4})年の(?:[^の]*シングル$|オリコンシングルチャート)/;

// 映像の特典や DVD の中身は曲目ではない
const SKIP_SECTION = /DVD|Blu-ray|BD|映像|特典映像|動画|Music Video|MV/i;

// 初回盤の小見出しの中に、特典映像の項目が曲と並んで書かれている記事がある
const NOT_A_SONG =
  /^(instrumental|off vocal|カラオケ)|映像|メイキング|Making|ドキュメンタリー|Music Video|Music Clip|Digest|密着|企画|メッセージ|ビデオ・クリップ|OFF SHOT|Voice Drama|ボイスドラマ|オフショット|Behind|Live Part|鑑賞会|約\d+分|〈MUSIC VIDEO〉/i;

function clean(text: string): string {
  return text
    .replace(/\[\[(?:File|ファイル|画像|Image):[^\]]*\]\]/gi, '')
    .replace(/<ref[^>]*\/>|<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/'{2,}/g, '')
    .trim();
}

/** 曲名の後ろに付く「 - 作詞…」「（…）」「(Album ver.)」以外の注記を外す */
function titleOf(line: string): string {
  const text = clean(line)
    // 「"Eagleheart" (3:50)」のような演奏時間と、「※」のような脚注の印
    .replace(/\s*[（(]\d+:\d{2}[）)]\s*$/, '')
    .replace(/※+$/, '')
    .replace(/^"(.+)"$/, '$1')
    .trim();
  const quoted = text.match(/^「(.+?)」/);
  if (quoted) return quoted[1].trim();
  return (
    text
      .split(/\s+[-–—]\s+|\s*［|\s*\[|　/)[0]
      // 作詞者などの注記は閉じ括弧が無いこともある
      .replace(/\s*[（(](作詞|作曲|編曲|詞|曲)[^）)]*[）)]?\s*$/, '')
      .replace(/\s*[（(][^（）()]*(収録|のみ|限定|読み)[^（）()]*[）)]\s*$/, '')
      .trim()
  );
}

/** 「収録曲」の節だけを返す。見出しの名前はアルバムによって揺れる */
function trackSection(text: string): string | null {
  const heading = /^(={2,3})\s*(収録曲|曲目|トラックリスト|収録内容)\s*\1\s*$/m.exec(text);
  if (!heading) return null;
  const level = heading[1].length;
  const rest = text.slice(heading.index + heading[0].length);
  const end = new RegExp(`^={2,${level}}[^=]`, 'm').exec(rest);
  return end ? rest.slice(0, end.index) : rest;
}

/** 小見出しで区切り、映像の小見出しの中身を落とす。「=== DVD ===」の下の「==== 初回盤 ====」のような、さらに下の見出しの中身も落とす */
function withoutVideo(section: string): string {
  let skipBelow = Infinity;
  return section
    .split(/^(?==+[^=\n]+=+\s*$)/m)
    .filter((part) => {
      const heading = part.match(/^(=+)([^=\n]+)=+/);
      if (!heading) return skipBelow === Infinity;
      const level = heading[1].length;
      if (level <= skipBelow) skipBelow = SKIP_SECTION.test(heading[2]) ? level : Infinity;
      return skipBelow === Infinity;
    })
    .join('\n');
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
    .split('\n')
    .filter((line) => /^#(?![#:*])/.test(line))
    .map((line) => titleOf(line.replace(/^#\s*/, '')));
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

// シングルは「夜空ノムコウ（オリジナル・カラオケ）」「Reboot!!! -Inst.-」のように、カラオケを曲名の後ろの注記で書く。
// 「涙 涙のカラオケボックス」のような曲名は残す
const KARAOKE =
  /(^|[\s（(〜~\-–])(?:オリジナル[・･]?)?(instrumental|inst\.?|off vocal|カラオケ|karaoke|back(ing)? track|music track)[^（）()]*[）)\-]?\s*$/i;

// 基礎情報欄の「Artist」。同じ曲名の別の歌手の記事や、カバーの元歌の記事が年のシングル分類に入っていることがある
// 1つの記事に、元歌とカバーの欄が並んでいることもある
const INFOBOX_ARTIST =
  /\{\{\s*(?:Infobox (?:Single|Song)|基礎情報 シングル)[^{}]*?\|\s*(?:Artist|アーティスト)\s*=\s*([^\n]*)/gi;
const INFOBOX_NAME =
  /\{\{\s*(?:Infobox (?:Single|Song)|基礎情報 シングル)[\s\S]*?\|\s*(?:Name|名前)\s*=\s*([^\n]*)/i;

async function main() {
  const artists: Artist[] = JSON.parse(await readFile('data/raw/artists.json', 'utf8'));
  const only = process.argv[2];
  const out = only ? `data/raw/albums-${only}.json` : 'data/raw/albums.json';
  const albums: Album[] = existsSync(out) ? JSON.parse(await readFile(out, 'utf8')) : [];
  const known = albums.length;

  for (const artist of artists) {
    if (only && artist.name !== only) continue;
    const own = `Category:${artist.name}の`;
    const pages = new Set<string>();
    const queue = [...artist.categories, `${own}楽曲`];
    for (const category of queue) {
      for (const title of await categoryMembers(category, true)) {
        if (!title.startsWith('Category:')) pages.add(title);
        // 「KAT-TUNの楽曲」の下の「赤西仁の楽曲」のような、別のアーティストの分類は辿らない
        else if (title.startsWith(own) && !queue.includes(title)) queue.push(title);
      }
    }
    pages.delete(artist.page);

    let count = 0;
    const categories = await categoriesOf([...pages]);
    for (const title of pages) {
      const cats = categories.get(title) ?? [];
      const albumYear = cats.map((c) => c.match(YEAR_CATEGORY)).find(Boolean);
      const singleYear = cats.map((c) => c.match(SINGLE_CATEGORY)).find(Boolean);
      // 「◯◯のアルバム」「◯◯のベスト・アルバム」に入っていればアルバム。
      // 名前だけの分類から来た記事は、年のアルバム分類で確かめる
      const isAlbum =
        cats.some((c) => c.startsWith(own) && c.endsWith('アルバム')) || Boolean(albumYear);
      if (!isAlbum && !singleYear) continue;
      const page = await wikitext(title);
      if (!page) continue;
      // 分類に入った別名の記事が、同じアルバムの記事へ転送されていることがある
      if (albums.some((a) => a.artist === artist.name && a.page === page.title)) continue;
      if (!isAlbum) {
        // 「[[Number_i]]」のように、リンクの空白を下線で書く記事もある
        const credited = [...page.text.matchAll(INFOBOX_ARTIST)].map((m) =>
          clean(m[1]).replace(/_/g, ' '),
        );
        // 欄の無い短い記事は、「{{SMAPのシングル}}」のような一覧の枠で確かめる
        const ok =
          credited.length > 0
            ? credited.some((c) => c.includes(artist.name))
            : page.text.includes(`{{${artist.name}のシングル}}`);
        if (!ok) continue;
      }
      const released = page.text.match(/\|\s*(?:Released|発売日?)\s*=[^\n]*?(\d{4})/i);
      let tracks = tracksOf(page.text).filter((t) => !KARAOKE.test(t));
      // 曲目の節が無いシングルでも、表題曲は入っている
      if (tracks.length === 0 && !isAlbum) {
        const name = page.text.match(INFOBOX_NAME)?.[1];
        tracks = [titleOf(name ?? title.replace(/ \([^)]*\)$/, ''))];
      }
      const yearCategory = isAlbum ? albumYear : singleYear;
      const year = yearCategory ? Number(yearCategory[1]) : released ? Number(released[1]) : null;
      albums.push({
        artist: artist.name,
        title: title.replace(/ \([^)]*\)$/, ''),
        page: page.title,
        year,
        kind: isAlbum ? 'album' : 'single',
        tracks,
      });
      count++;
    }
    console.error(`${artist.name}: 新しく ${count} 枚`);
  }

  await writeFile(out, `${JSON.stringify(albums, null, 2)}\n`);
  const added = albums.slice(known);
  const empty = added.filter((a) => a.tracks.length === 0);
  console.error(
    `新しく ${added.length} 枚（シングル ${added.filter((a) => a.kind === 'single').length}）、曲 ${added.reduce((n, a) => n + a.tracks.length, 0)} 曲、曲目が取れなかったもの ${empty.length} 枚`,
  );
}

main();
