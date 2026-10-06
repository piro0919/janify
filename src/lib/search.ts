import type { QueueItem } from './catalog';
import { norm } from './song';

export type SearchIndex = {
  artists: { id: string; name: string; cover: string | null; albums: number }[];
  albums: {
    id: string;
    title: string;
    year: number | null;
    artistName: string;
    cover: string | null;
  }[];
  songs: QueueItem[];
};

/** 表記ゆれ（全角半角・大小・記号）を無視して、語を含むものを拾う */
export function search(index: SearchIndex, query: string) {
  const q = norm(query);
  if (!q) return null;
  const hit = (...texts: string[]) => texts.some((t) => norm(t).includes(q));
  return {
    artists: index.artists.filter((a) => hit(a.name)),
    albums: index.albums.filter((a) => hit(a.title, a.artistName)),
    // 曲名で当たった曲を先に、アーティスト名で当たった曲を後に
    songs: [
      ...index.songs.filter((s) => hit(s.title)),
      ...index.songs.filter((s) => !hit(s.title) && hit(s.artistName)),
    ],
  };
}
