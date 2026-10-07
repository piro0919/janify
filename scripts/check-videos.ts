// 掲載中の動画が、まだ埋め込みで流せるかを確かめる。GitHub Actions で週に1回動かす（.github/workflows/check-videos.yml）。
// 非公式の動画は削除や埋め込みの停止が起きやすい。プレイヤーは流せない曲を黙って飛ばすので、ここで気づく。
// YouTube Data API の videos.list で、50本を1単位で見る（全部で100単位ほど）。規約上、API 以外で YouTube を読まない。
// 見られない動画が1本でもあれば一覧を出して終了コード 1 で終わる。Actions が失敗し、メールで届く。
// 直し方: Notion の「曲」で「YouTube」を差し替えるか空にし、`pnpm notion:export` で書き出してコミットする
import { readFile } from 'node:fs/promises';
import { youtube } from './lib/youtube';

type Catalog = {
  name: string;
  albums: {
    title: string;
    tracks: { title: string; videoId: string | null; kind: string | null }[];
  }[];
}[];

type Video = {
  id: string;
  status: { privacyStatus: string; embeddable: boolean; uploadStatus: string };
  contentDetails: { regionRestriction?: { allowed?: string[]; blocked?: string[] } };
};

/** 流せない理由。流せるなら null */
function problem(video: Video | undefined): string | null {
  if (!video) return '削除';
  if (video.status.privacyStatus === 'private') return '非公開';
  if (video.status.uploadStatus === 'rejected' || video.status.uploadStatus === 'deleted')
    return '削除';
  if (!video.status.embeddable) return '埋め込み停止';
  const region = video.contentDetails.regionRestriction;
  if (region?.blocked?.includes('JP') || (region?.allowed && !region.allowed.includes('JP'))) {
    return '日本で見られない';
  }
  return null;
}

async function main() {
  const catalog = JSON.parse(await readFile('src/data/catalog.json', 'utf8')) as Catalog;
  const songs = catalog.flatMap((artist) =>
    artist.albums.flatMap((album) =>
      album.tracks.flatMap((t) =>
        t.videoId
          ? [
              {
                artist: artist.name,
                album: album.title,
                title: t.title,
                kind: t.kind,
                videoId: t.videoId,
              },
            ]
          : [],
      ),
    ),
  );
  const ids = [...new Set(songs.map((s) => s.videoId))];

  const found = new Map<string, Video>();
  for (let i = 0; i < ids.length; i += 50) {
    const body = await youtube<{ items?: Video[] }>('videos', {
      part: 'status,contentDetails',
      id: ids.slice(i, i + 50).join(','),
      maxResults: '50',
    });
    for (const v of body.items ?? []) found.set(v.id, v);
  }

  const dead = new Map(
    ids.flatMap((id) => {
      const reason = problem(found.get(id));
      return reason ? [[id, reason] as const] : [];
    }),
  );
  console.log(`確認 ${ids.length} 本 / 流せない ${dead.size} 本`);
  for (const s of songs.filter((s) => dead.has(s.videoId))) {
    console.log(
      `- ${s.artist}『${s.album}』「${s.title}」 ${s.kind} ${s.videoId} ${dead.get(s.videoId)}`,
    );
  }
  if (dead.size > 0) process.exitCode = 1;
}

main();
