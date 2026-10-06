// 曲と YouTube の動画を突き合わせ、data/raw/matches.json に書く。
// - Topic チャンネルの音源: 題名と曲名が一致したもの（全尺の公式音源）
// - 公式チャンネルの MV: 題名の「」などの中が曲名と一致し、MV を示す語が入っているもの
// 両方あるときは、MV が全尺なら MV を使う（顔が見える）。ショート版なら Topic の音源を使う
import { readFile, writeFile } from "node:fs/promises";

type Album = { artist: string; page: string; title: string; tracks: string[] };
type Artist = { name: string; page: string };
type Video = { id: string; title: string; channel: string; topic: boolean; seconds: number };
type Match = { videoId: string; kind: "mv" | "audio"; videoTitle: string };

const MV = /music video|music clip|\bmv\b|\bpv\b|official video|ミュージックビデオ/i;
// 「MV鑑賞会」「MV preview」「MV公開直前 YouTube Live」のような、MV を見る企画も弾く
const NOT_MV =
  /teaser|trailer|short|shorts|#shorts|dance practice|behind|making|メイキング|ティザー|予告|spot|digest|ダイジェスト|reaction|リアクション|鑑賞|preview|公開直前|youtube live|考察|lyric|歌詞|ver\.\s*\)?\s*$/i;

/** 全角半角・大小・記号・空白の違いを潰す */
const norm = (s: string) =>
  s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\-‐–—~〜～・･!！?？.,、。'’"“”`*★☆♪♡＆&:：;/／]/g, "");

/** 末尾の (Album ver.) のような注記を外したもの。一致しないときの二段目に使う */
const bare = (s: string) => norm(s.replace(/\s*[（(［\[][^（）()［］\[\]]*[）)］\]]\s*$/, ""));

function quoted(title: string): string[] {
  return [...title.matchAll(/[「『"“]([^」』"”]+)[」』"”]/g)].map((m) => m[1]);
}

async function main() {
  const artists: Artist[] = JSON.parse(await readFile("data/raw/artists.json", "utf8"));
  const albums: Album[] = JSON.parse(await readFile("data/raw/albums.json", "utf8"));
  const videos: Record<string, Video[]> = JSON.parse(await readFile("data/raw/videos.json", "utf8"));
  const matches: Record<string, Match> = {};
  const stats = { tracks: 0, mv: 0, audio: 0 };

  for (const album of albums) {
    const pool = videos[album.artist] ?? [];
    const artist = artists.find((a) => a.name === album.artist)!;
    const audio = pool.filter((v) => v.topic);
    const mvs = pool.filter((v) => !v.topic && MV.test(v.title) && !NOT_MV.test(v.title));

    for (const [i, track] of album.tracks.entries()) {
      stats.tracks++;
      const key = `track:album:${artist.page}:${album.page}:${i}`;
      const n = norm(track);
      if (n.length === 0) continue;

      const topic =
        audio.find((v) => norm(v.title) === n) ?? audio.find((v) => bare(v.title) === bare(track) && bare(track).length > 0);
      const mv = mvs.find((v) => quoted(v.title).some((q) => norm(q) === n));

      // MV がショート版かどうかは、Topic の音源の長さと比べて見る。音源が無ければ2分半を目安にする
      const fullMv = mv && (topic ? mv.seconds >= topic.seconds * 0.9 : mv.seconds >= 150);
      if (fullMv) {
        matches[key] = { videoId: mv.id, kind: "mv", videoTitle: mv.title };
        stats.mv++;
      } else if (topic) {
        matches[key] = { videoId: topic.id, kind: "audio", videoTitle: topic.title };
        stats.audio++;
      }
    }
  }

  await writeFile("data/raw/matches.json", `${JSON.stringify(matches, null, 2)}\n`);
  const hit = stats.mv + stats.audio;
  console.error(`曲 ${stats.tracks}、当たり ${hit}（MV ${stats.mv}、音源 ${stats.audio}）、${Math.round((hit / stats.tracks) * 100)}%`);
}

main();
