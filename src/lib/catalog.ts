// カタログは約500KBあり、ブラウザ側に入ると全ページの読み込みが重くなる。
// ブラウザ側の部品から値として読み込むとビルドで止まるよう、サーバー専用にする（型だけの読み込みは構わない）
import 'server-only';
import catalog from '@/data/catalog.json';
import { bareTitle, songKey } from '@/lib/song';
import { thumbOf } from '@/lib/thumb';

// 正本は Notion。src/data/catalog.json は scripts/notion-export.ts が書き出したもので、手で直さない
type VideoKind = 'mv' | 'audio' | 'unofficial';
export type Track = { title: string; videoId: string | null; kind: VideoKind | null };
/** kind はアルバムかシングルか。シングルもアルバムと同じ画面で流す */
export type Album = {
  id: string;
  title: string;
  year: number | null;
  kind: 'album' | 'single';
  tracks: Track[];
};
/**
 * icon は YouTube のチャンネルのアイコン。公式のチャンネルが無いアーティストは null。
 * tenure はジャニーズ（後継の STARTO ENTERTAINMENT を含む）に所属していた年の範囲。to が null ならいまも所属。
 * 空の配列は、所属していた間に作品が無いもの（退所後に結成したグループなど）。null は調べていないもの
 */
export type Artist = {
  id: string;
  name: string;
  icon: string | null;
  tenure: { from: number; to: number | null }[] | null;
  albums: Album[];
};

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

/** シングルを除いたアルバム */
export const albumsOf = (artist: Artist) => artist.albums.filter((a) => a.kind === 'album');
export const singlesOf = (artist: Artist) => artist.albums.filter((a) => a.kind === 'single');

/** アーティストのカードの添え書き。アルバムの無いアーティストはシングルの数 */
export function discographyOf(artist: Artist): string {
  const albums = albumsOf(artist).length;
  return albums > 0 ? `アルバム ${albums} 枚` : `シングル ${singlesOf(artist).length} 枚`;
}

/**
 * 全アルバムを新しい順に。発売年の無いものは最後。
 * シングルは入れない。数が多く、新しいアルバムの棚や年代の一覧がシングルで埋まるので、アーティストの画面から辿る
 */
export const albumsByNewest: AlbumEntry[] = artists
  .flatMap((artist) => albumsOf(artist).map((album) => ({ artist, album })))
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
 * MV → 公式の音源 → 非公式の順に動画を選ぶ。歌の入っていない版は入れない。
 * counts を渡すと、count はそれに合うアルバムだけで数える（total はすべてのアルバムの数で、同じ count のときの順に使う）
 */
export function songsOf(
  artist: Artist,
  counts: (album: Album) => boolean = () => true,
): { count: number; total: number; song: QueueItem }[] {
  const songs = new Map<string, { count: number; total: number; song: QueueItem; rank: number }>();
  for (const album of artist.albums) {
    const seen = new Set<string>();
    const add = counts(album) ? 1 : 0;
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
        songs.set(key, { count: add, total: 1, song, rank });
      } else {
        found.count += add;
        found.total++;
        if (rank < found.rank) Object.assign(found, { song, rank });
      }
    }
  }
  return [...songs.values()].toSorted(byCount);
}

const byCount = (a: { count: number; total: number }, b: { count: number; total: number }) =>
  b.count - a.count || b.total - a.total;

/**
 * ジャニーズに所属していた間に出たアルバムか。所属期間が分からないアーティスト（tenure が null）はすべて数える。
 * 発売年の分からないアルバムは数えない
 */
export function inTenure(artist: Artist, album: Album): boolean {
  if (!artist.tenure) return true;
  const { year } = album;
  if (year === null) return false;
  return artist.tenure.some((p) => p.from <= year && year <= (p.to ?? Infinity));
}

/**
 * 人気曲。そのまま数で並べるとベスト盤の多いアーティストだけで埋まるので、アーティストごとの
 * 1曲目を数の多い順に並べ、足りなければ2曲目、3曲目と順に足す。
 * 数えるのはジャニーズに所属していた間に出たアルバムとシングルだけ。退所後の作品が多い
 * アーティスト（郷ひろみなど）が先頭に来ないようにする（2026-11-11、本人の判断）
 */
export function popularSongs(limit: number): QueueItem[] {
  const perArtist = artists.map((a) => songsOf(a, (album) => inTenure(a, album)));
  const result: QueueItem[] = [];
  for (let round = 0; result.length < limit; round++) {
    const picks = perArtist.flatMap((songs) => (songs[round] ? [songs[round]] : []));
    if (picks.length === 0) break;
    result.push(...picks.toSorted(byCount).map((s) => s.song));
  }
  return result.slice(0, limit);
}
