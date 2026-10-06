import catalog from '@/data/catalog.json';
import { bareTitle, songKey } from '@/lib/song';

// 正本は Notion。src/data/catalog.json は scripts/notion-export.ts が書き出したもので、手で直さない
export type VideoKind = 'mv' | 'audio' | 'unofficial';
export type Track = { title: string; videoId: string | null; kind: VideoKind | null };
export type Album = { id: string; title: string; year: number | null; tracks: Track[] };
export type Artist = { id: string; name: string; albums: Album[] };

/** 再生の順番待ちに積む1曲。どのアルバムの曲かを持ち、プレイヤーの帯に出す */
export type QueueItem = {
  title: string;
  videoId: string;
  albumId: string;
  albumTitle: string;
  artistId: string;
  artistName: string;
};

export const artists = catalog as Artist[];

export function findArtist(id: string): Artist | undefined {
  return artists.find((a) => a.id === id);
}

export function findAlbum(id: string): { artist: Artist; album: Album } | undefined {
  for (const artist of artists) {
    const album = artist.albums.find((a) => a.id === id);
    if (album) return { artist, album };
  }
}

/**
 * YouTube のサムネイル。mqdefault は動画と同じ 16:9 で、黒い帯が入らない。
 * hqdefault は 4:3 に黒い帯が付いていて、16:9 の枠に収めると端を切ることになる（サムネイルの改変は規約で禁止）
 */
export function thumbOf(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

/** 一覧に出す絵。顔が映りやすい MV を先に探し、無ければ音源の絵（ジャケット）を使う */
export function coverOf(tracks: Track[]): string | null {
  const video = tracks.find((t) => t.kind === 'mv') ?? tracks.find((t) => t.videoId);
  return video?.videoId ? thumbOf(video.videoId) : null;
}

/** アルバムの再生できる曲を、順番待ちの形にする */
export function queueOf(artist: Artist, album: Album): QueueItem[] {
  return album.tracks.flatMap((t) =>
    t.videoId
      ? [
          {
            title: t.title,
            videoId: t.videoId,
            albumId: album.id,
            albumTitle: album.title,
            artistId: artist.id,
            artistName: artist.name,
          },
        ]
      : [],
  );
}

export type AlbumEntry = { artist: Artist; album: Album };

/** 全アルバムを新しい順に。発売年の無いものは最後 */
export const albumsByNewest: AlbumEntry[] = artists
  .flatMap((artist) => artist.albums.map((album) => ({ artist, album })))
  .toSorted((a, b) => (b.album.year ?? -Infinity) - (a.album.year ?? -Infinity));

/** 年代ごとのアルバム。新しい年代から。発売年の無いアルバムはどこにも入れない */
export const decades: { decade: number; albums: AlbumEntry[] }[] = [
  ...Map.groupBy(
    albumsByNewest.flatMap((e) => (e.album.year === null ? [] : [{ ...e, year: e.album.year }])),
    (e) => Math.floor(e.year / 10) * 10,
  ),
].map(([decade, albums]) => ({ decade, albums }));

const KIND_RANK: Record<VideoKind, number> = { mv: 0, audio: 1, unofficial: 2 };

/** 歌の入っていない版。人気曲の候補にしない */
const NO_VOCAL = /instrumental|inst\.|karaoke|カラオケ|off ?vocal|backing track/i;

/**
 * アーティストの曲を、同じ曲は1つにまとめて、入っているアルバムの数の多い順に。
 * シングル曲はベスト盤やライブ盤に何度も入るので、この数が多いほど代表曲と見なせる。
 * 同じ曲が何枚にも入っているときは、(Live) などの注記の無い版を先に、そのうえで
 * MV → 公式の音源 → 非公式の順に動画を選ぶ。歌の入っていない版は入れない
 */
export function songsOf(artist: Artist): { count: number; song: QueueItem }[] {
  const songs = new Map<string, { count: number; song: QueueItem; rank: number }>();
  for (const album of artist.albums) {
    const seen = new Set<string>();
    for (const { title, videoId, kind } of album.tracks) {
      if (!videoId || !kind || NO_VOCAL.test(title)) continue;
      const key = songKey(artist.name, title);
      if (seen.has(key)) continue;
      seen.add(key);
      const rank = (bareTitle(title) === title ? 0 : 10) + KIND_RANK[kind];
      const song: QueueItem = {
        title,
        videoId,
        albumId: album.id,
        albumTitle: album.title,
        artistId: artist.id,
        artistName: artist.name,
      };
      const found = songs.get(key);
      if (!found) {
        songs.set(key, { count: 1, song, rank });
      } else {
        found.count++;
        if (rank < found.rank) Object.assign(found, { song, rank });
      }
    }
  }
  return [...songs.values()].toSorted((a, b) => b.count - a.count);
}

/**
 * 人気曲。そのまま数で並べるとベスト盤の多いアーティストだけで埋まるので、アーティストごとの
 * 1曲目を数の多い順に並べ、足りなければ2曲目、3曲目と順に足す
 */
export function popularSongs(limit: number): QueueItem[] {
  const perArtist = artists.map(songsOf);
  const result: QueueItem[] = [];
  for (let round = 0; result.length < limit; round++) {
    const picks = perArtist.flatMap((songs) => (songs[round] ? [songs[round]] : []));
    if (picks.length === 0) break;
    result.push(...picks.toSorted((a, b) => b.count - a.count).map((s) => s.song));
  }
  return result.slice(0, limit);
}
