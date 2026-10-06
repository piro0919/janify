// 当てはめた動画を、Notion の「曲」の YouTube と動画の列へ書く。
// - data/raw/matches.json: 公式の MV と Topic の音源（youtube:match）
// - data/raw/unofficial.json: 非公式の動画（youtube:unofficial）。曲ごとの当たりを、同じ曲のすべての行に配る
// 行の特定には notion-import.ts が残した data/raw/notion-progress.json を使う。
// すでに YouTube が入っている行は、手で直したものかもしれないので上書きしない。何度走らせてもよい
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { notion, queryAll } from './lib/notion';
import { songKey } from './lib/song';

type Album = { artist: string; page: string; tracks: string[] };
type Artist = { name: string; page: string };
type Match = { videoId: string; kind: 'mv' | 'audio' };

const LABEL = { mv: 'MV', audio: '音源', unofficial: '非公式' } as const;

async function main() {
  const ids = JSON.parse(await readFile('scripts/notion-ids.json', 'utf8'));
  const progress: Record<string, string> = JSON.parse(
    await readFile('data/raw/notion-progress.json', 'utf8'),
  );
  const official: Record<string, Match> = JSON.parse(
    await readFile('data/raw/matches.json', 'utf8'),
  );
  const unofficial: { songs: Record<string, { videoId: string }> } = existsSync(
    'data/raw/unofficial.json',
  )
    ? JSON.parse(await readFile('data/raw/unofficial.json', 'utf8'))
    : { songs: {} };
  const artists: Artist[] = JSON.parse(await readFile('data/raw/artists.json', 'utf8'));
  const albums: Album[] = JSON.parse(await readFile('data/raw/albums.json', 'utf8'));

  const wanted = new Map<string, { videoId: string; kind: keyof typeof LABEL }>();
  for (const album of albums) {
    const page = artists.find((a) => a.name === album.artist)!.page;
    album.tracks.forEach((track, i) => {
      const key = `track:album:${page}:${album.page}:${i}`;
      const o = official[key];
      const u = unofficial.songs[songKey(album.artist, track)];
      if (o) wanted.set(key, o);
      else if (u) wanted.set(key, { videoId: u.videoId, kind: 'unofficial' });
    });
  }

  await notion('PATCH', `/data_sources/${ids.tracks}`, {
    properties: { 動画: { select: { options: Object.values(LABEL).map((name) => ({ name })) } } },
  });

  const filled = new Set(
    (await queryAll(ids.tracks)).filter((p) => p.properties.YouTube?.url).map((p) => p.id),
  );
  const targets = [...wanted].filter(([key]) => progress[key] && !filled.has(progress[key]));

  let done = 0;
  for (let i = 0; i < targets.length; i += 30) {
    const batch = targets.slice(i, i + 30);
    await Promise.all(
      batch.map(([key, m]) =>
        notion('PATCH', `/pages/${progress[key]}`, {
          properties: {
            YouTube: { url: `https://www.youtube.com/watch?v=${m.videoId}` },
            動画: { select: { name: LABEL[m.kind] } },
          },
        }),
      ),
    );
    done += batch.length;
    console.error(`${done}/${targets.length}`);
  }
}

main();
