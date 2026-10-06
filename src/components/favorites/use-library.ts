'use client';

import { useEffect, useState } from 'react';
import type { QueueItem } from '@/lib/catalog';
import { type LibraryIndex, songKeyOf } from '@/lib/library';
import type { Favorites } from './favorites-store';
import { useFavorites } from './use-favorites';

let loading: Promise<LibraryIndex> | undefined;
const loadLibraryIndex = () =>
  (loading ??= fetch('/library-index').then((r) => r.json() as Promise<LibraryIndex>));

export type LibraryAlbum = LibraryIndex['albums'][string] & { id: string };
export type LibraryArtist = LibraryIndex['artists'][string] & { id: string };

/**
 * お気に入りを、今掲載しているものと突き合わせて取り出す。並びはお気に入りの並び順。
 * 索引はお気に入りが1つでもあるときだけ取りに行く。
 *
 * この画面を開いているあいだに外したものは、すぐには消さず、元の位置に残す（removed に入る）。
 * うっかり外しても、その場でもう一度押せば戻せる。画面を離れると消える
 */
export function useLibrary(): {
  ready: boolean;
  songs: QueueItem[];
  albums: LibraryAlbum[];
  artists: LibraryArtist[];
  /** 開いているあいだに外したもの。`songs:鍵` `albums:id` `artists:id` の形 */
  removed: Set<string>;
} {
  const favorites = useFavorites();
  const any = favorites.songs.length + favorites.albums.length + favorites.artists.length > 0;
  const [index, setIndex] = useState<LibraryIndex | null>(null);

  // 画面に出している並び。外したものも、元の位置に残しておく
  const [shown, setShown] = useState<Favorites>(favorites);
  const [prev, setPrev] = useState<Favorites>(favorites);
  if (favorites !== prev) {
    setPrev(favorites);
    setShown(keepRemoved(shown, favorites));
  }

  useEffect(() => {
    if ((any || shown.songs.length > 0) && !index) void loadLibraryIndex().then(setIndex);
  }, [any, shown.songs.length, index]);

  const removed = new Set<string>();
  for (const kind of ['songs', 'albums', 'artists'] as const) {
    for (const key of shown[kind])
      if (!favorites[kind].includes(key)) removed.add(`${kind}:${key}`);
  }

  if (!index) return { ready: !any, songs: [], albums: [], artists: [], removed };
  return {
    ready: true,
    songs: shown.songs.flatMap((k) => index.songs[k] ?? []),
    albums: shown.albums.flatMap((id) => (index.albums[id] ? [{ ...index.albums[id], id }] : [])),
    artists: shown.artists.flatMap((id) =>
      index.artists[id] ? [{ ...index.artists[id], id }] : [],
    ),
    removed,
  };
}

/** 今のお気に入りの並びを基に、前に出していて外れたものを、前と同じ位置に差し戻す */
function keepRemoved(before: Favorites, now: Favorites): Favorites {
  const merge = (old: string[], next: string[]) => {
    const out = [...next];
    old.forEach((key, i) => {
      if (!next.includes(key)) out.splice(Math.min(i, out.length), 0, key);
    });
    return out;
  };
  return {
    songs: merge(before.songs, now.songs),
    albums: merge(before.albums, now.albums),
    artists: merge(before.artists, now.artists),
  };
}

/** 外したものを除いたお気に入り。トップやライブラリの一覧のように、その場で出し入れしない画面で使う */
export function useLibraryKept() {
  const { ready, songs, albums, artists, removed } = useLibrary();
  return {
    ready,
    songs: songs.filter((s) => !removed.has(`songs:${songKeyOf(s)}`)),
    albums: albums.filter((a) => !removed.has(`albums:${a.id}`)),
    artists: artists.filter((a) => !removed.has(`artists:${a.id}`)),
  };
}
