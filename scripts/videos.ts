// scripts/channels.json のチャンネルから投稿一覧を取り、data/raw/videos.json に書く。
// 投稿一覧は50本で1単位なので、全部取っても数百単位で済む。
// 埋め込みできない動画と、日本で見られない動画はここで落とす
import { readFile, writeFile } from 'node:fs/promises';
import { youtube } from './lib/youtube';

type Video = { id: string; title: string; channel: string; topic: boolean; seconds: number };

function seconds(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

async function playlist(playlistId: string): Promise<{ id: string; title: string }[]> {
  const items: { id: string; title: string }[] = [];
  let pageToken: string | undefined;
  do {
    const res = await youtube('playlistItems', {
      part: 'snippet',
      playlistId,
      maxResults: '50',
      ...(pageToken ? { pageToken } : {}),
    });
    for (const i of res.items)
      items.push({ id: i.snippet.resourceId.videoId, title: i.snippet.title });
    pageToken = res.nextPageToken;
  } while (pageToken);
  return items;
}

/** 投稿一覧。Topic チャンネルには投稿一覧が無く、曲をアルバムごとの再生リストにだけ持つものがある */
async function uploads(channelId: string): Promise<{ id: string; title: string }[]> {
  try {
    return await playlist(`UU${channelId.slice(2)}`);
  } catch (e) {
    if (!String(e).includes('404')) throw e;
  }
  const items = new Map<string, { id: string; title: string }>();
  let pageToken: string | undefined;
  do {
    const res = await youtube('playlists', {
      part: 'id',
      channelId,
      maxResults: '50',
      ...(pageToken ? { pageToken } : {}),
    });
    for (const p of res.items) for (const v of await playlist(p.id)) items.set(v.id, v);
    pageToken = res.nextPageToken;
  } while (pageToken);
  return [...items.values()];
}

async function main() {
  const channels: Record<string, string[]> = JSON.parse(
    await readFile('scripts/channels.json', 'utf8'),
  );
  const result: Record<string, Video[]> = {};

  for (const [artist, ids] of Object.entries(channels)) {
    result[artist] = [];
    for (const channelId of ids) {
      const info = await youtube('channels', { part: 'snippet', id: channelId });
      const channel: string = info.items[0].snippet.title;
      const items = await uploads(channelId);

      for (let i = 0; i < items.length; i += 50) {
        const batch = items.slice(i, i + 50);
        const res = await youtube('videos', {
          part: 'status,contentDetails',
          id: batch.map((v) => v.id).join(','),
        });
        for (const v of res.items) {
          const region = v.contentDetails.regionRestriction;
          const blocked =
            region &&
            ((region.allowed && !region.allowed.includes('JP')) || region.blocked?.includes('JP'));
          if (!v.status.embeddable || v.status.privacyStatus !== 'public' || blocked) continue;
          const title = batch.find((b) => b.id === v.id)!.title;
          result[artist].push({
            id: v.id,
            title,
            channel,
            topic: channel.endsWith(' - Topic'),
            seconds: seconds(v.contentDetails.duration),
          });
        }
      }
      console.error(`${artist} / ${channel}: ${items.length} 本`);
    }
  }

  await writeFile('data/raw/videos.json', `${JSON.stringify(result, null, 2)}\n`);
  console.error(`動画 ${Object.values(result).reduce((n, v) => n + v.length, 0)} 本`);
}

main();
