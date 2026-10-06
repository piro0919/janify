// Notion の「アーティスト」「アルバム」「曲」を読み、src/data/catalog.json を丸ごと作り直す。
// 正本は Notion。catalog.json は手で直さず、これを走らせてコミットする。ビルドからは呼ばない。
// 掲載の外れた行と、再生できる曲が1曲も無いアルバム・アーティストは書き出さない
import { readFile, writeFile } from "node:fs/promises";
import { queryAll } from "./lib/notion";

type Row = { id: string; properties: Record<string, any> };

const text = (p: any): string => (p?.title ?? p?.rich_text ?? []).map((t: any) => t.plain_text).join("");
const relation = (p: any): string | undefined => p?.relation?.[0]?.id;
const shortId = (id: string) => id.replace(/-/g, "");

function videoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

const KIND: Record<string, string> = { MV: "mv", 音源: "audio", 非公式: "unofficial" };

async function main() {
  const ids = JSON.parse(await readFile("scripts/notion-ids.json", "utf8"));
  const [artistRows, albumRows, trackRows] = (await Promise.all([
    queryAll(ids.artists),
    queryAll(ids.albums),
    queryAll(ids.tracks),
  ])) as Row[][];

  const listed = (r: Row) => r.properties["掲載"]?.checkbox === true;

  const tracksByAlbum = new Map<string, Row[]>();
  for (const t of trackRows.filter(listed)) {
    const album = relation(t.properties["アルバム"]);
    if (!album) continue;
    tracksByAlbum.set(album, [...(tracksByAlbum.get(album) ?? []), t]);
  }

  const albumsByArtist = new Map<string, Row[]>();
  for (const a of albumRows.filter(listed)) {
    const artist = relation(a.properties["アーティスト"]);
    if (!artist) continue;
    albumsByArtist.set(artist, [...(albumsByArtist.get(artist) ?? []), a]);
  }

  const catalog = artistRows
    .filter(listed)
    .map((artist) => ({
      id: shortId(artist.id),
      name: text(artist.properties["名前"]),
      albums: (albumsByArtist.get(artist.id) ?? [])
        .map((album) => ({
          id: shortId(album.id),
          title: text(album.properties["タイトル"]),
          year: album.properties["発売年"]?.number ?? null,
          tracks: (tracksByAlbum.get(album.id) ?? [])
            .sort((a, b) => (a.properties["曲順"]?.number ?? 0) - (b.properties["曲順"]?.number ?? 0))
            .map((t) => {
              const id = videoId(t.properties.YouTube?.url);
              return {
                title: text(t.properties["曲名"]),
                videoId: id,
                kind: id ? (KIND[t.properties["動画"]?.select?.name] ?? "audio") : null,
              };
            }),
        }))
        .filter((album) => album.tracks.some((t) => t.videoId))
        .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || a.title.localeCompare(b.title, "ja")),
    }))
    .filter((artist) => artist.albums.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));

  await writeFile("src/data/catalog.json", `${JSON.stringify(catalog)}\n`);
  const albums = catalog.flatMap((a) => a.albums);
  const tracks = albums.flatMap((a) => a.tracks);
  console.error(
    `アーティスト ${catalog.length} 組、アルバム ${albums.length} 枚、曲 ${tracks.length} 曲（再生できる曲 ${tracks.filter((t) => t.videoId).length}）`,
  );
}

main();
