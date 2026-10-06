// 公式の動画も音源も当たらなかった曲を、非公式の動画で埋める。data/raw/unofficial.json に足していく。
// 非公式の動画はたくさんの個人のチャンネルにばらばらに上がっているので、1曲ずつ「アーティスト名 曲名」で検索する。
// 検索は1回100単位で、無料枠では1日100回ほど。多くのアルバムに入っている曲（シングルなど）から先に検索する。
// 同じ曲がベスト盤などに何度も出てくるので、検索は曲ごとに1回で、当たりは同じ曲すべてに配る。
// 一日分を使い切ったら止まり、翌日に走らせ直すと続きから検索する。
//   pnpm youtube:unofficial        残りを、枠の許す限り
//   pnpm youtube:unofficial 5      5曲だけ検索する（試し用）
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { bareTitle, norm, songKey } from "./lib/song";
import { youtube } from "./lib/youtube";

type Album = { artist: string; page: string; title: string; tracks: string[] };
type Artist = { name: string; page: string };
type Found = { videoId: string; videoTitle: string; channel: string };
type State = { searched: string[]; songs: Record<string, Found> };

const STATE_FILE = "data/raw/unofficial.json";

// 歌ってみた・演奏・カラオケ・反応動画などは本人の歌ではない
const NOT_ORIGINAL =
  /cover|カバー|歌ってみた|弾いてみた|叩いてみた|踊ってみた|piano|ピアノ|guitar|ギター|カラオケ|karaoke|instrumental|インスト|オルゴール|music box|8bit|耳コピ|練習|tutorial|react|リアクション|ハモ|アカペラ|a cappella|remix|ai\s*cover|比較|#shorts|解説|dance studio|tiktok/i;

async function main() {
  const limit = Number(process.argv[2] ?? Infinity);
  const artists: Artist[] = JSON.parse(await readFile("data/raw/artists.json", "utf8"));
  const albums: Album[] = JSON.parse(await readFile("data/raw/albums.json", "utf8"));
  const official: Record<string, unknown> = JSON.parse(await readFile("data/raw/matches.json", "utf8"));
  const state: State = existsSync(STATE_FILE)
    ? JSON.parse(await readFile(STATE_FILE, "utf8"))
    : { searched: [], songs: {} };

  // 公式で当たらなかった曲を、曲ごとにまとめて数える
  const songs = new Map<string, { artist: string; title: string; count: number }>();
  for (const album of albums) {
    const page = artists.find((a) => a.name === album.artist)!.page;
    album.tracks.forEach((track, i) => {
      if (official[`track:album:${page}:${album.page}:${i}`]) return;
      const key = songKey(album.artist, track);
      if (norm(bareTitle(track)).length < 2) return;
      const song = songs.get(key) ?? { artist: album.artist, title: bareTitle(track), count: 0 };
      song.count++;
      songs.set(key, song);
    });
  }

  const queue = [...songs.entries()]
    .filter(([key]) => !state.searched.includes(key))
    .sort((a, b) => b[1].count - a[1].count);
  console.error(`検索が要る曲 ${queue.length} 曲`);

  let searches = 0;
  for (const [key, song] of queue) {
    if (searches >= limit) break;
    let items: { id: { videoId: string }; snippet: { title: string; channelTitle: string } }[];
    try {
      const res = await youtube("search", {
        part: "snippet",
        type: "video",
        q: `${song.artist} ${song.title}`,
        maxResults: "10",
        regionCode: "JP",
        videoEmbeddable: "true",
      });
      items = res.items;
    } catch (e) {
      // 枠切れは 403 quotaExceeded のほか、429 "Quota exceeded" でも返ってくる
      if (/quota/i.test(String(e))) {
        console.error("今日の検索枠を使い切った。明日また走らせると続きから検索する");
        break;
      }
      throw e;
    }
    searches++;
    state.searched.push(key);

    // 題名にアーティスト名と曲名が両方入り、アーティスト名と曲名を除くと残りが短いものを取る。
    // 「Love」が「Love so sweet」に当たったり、メドレーや番組の切り抜きに当たったりするのを防ぐ
    const artist = norm(song.artist);
    const title = norm(song.title);
    const hit = items.find((v) => {
      const t = norm(v.snippet.title);
      if (!t.includes(artist) || !t.includes(title) || NOT_ORIGINAL.test(v.snippet.title)) return false;
      const rest = t.replace(artist, "").replace(title, "");
      return rest.length <= 12;
    });
    if (hit) state.songs[key] = { videoId: hit.id.videoId, videoTitle: hit.snippet.title, channel: hit.snippet.channelTitle };
    console.error(`${song.artist} / ${song.title}: ${hit ? hit.snippet.title : "なし"}`);
    await writeFile(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
  }

  console.error(`検索 ${searches} 回、非公式で当たった曲 ${Object.keys(state.songs).length} 曲`);
}

main();
