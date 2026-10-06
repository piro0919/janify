'use client';

import { useEffect, useState } from 'react';
import type { QueueItem } from '@/lib/catalog';
import type { LibraryIndex } from '@/lib/library';
import { useFavorites } from './use-favorites';

let loading: Promise<LibraryIndex> | undefined;
const loadLibraryIndex = () =>
  (loading ??= fetch('/library-index').then((r) => r.json() as Promise<LibraryIndex>));

export type LibraryAlbum = LibraryIndex['albums'][string] & { id: string };
export type LibraryArtist = LibraryIndex['artists'][string] & { id: string };

/**
 * お気に入りを、今掲載しているものと突き合わせて取り出す。新しく入れた順。
 * 索引はお気に入りが1つでもあるときだけ取りに行く
 */
export function useLibrary(): {
  ready: boolean;
  songs: QueueItem[];
  albums: LibraryAlbum[];
  artists: LibraryArtist[];
} {
  const favorites = useFavorites();
  const any = favorites.songs.length + favorites.albums.length + favorites.artists.length > 0;
  const [index, setIndex] = useState<LibraryIndex | null>(null);

  useEffect(() => {
    if (any && !index) void loadLibraryIndex().then(setIndex);
  }, [any, index]);

  if (!index) return { ready: !any, songs: [], albums: [], artists: [] };
  return {
    ready: true,
    songs: favorites.songs.flatMap((k) => index.songs[k] ?? []),
    albums: favorites.albums.flatMap((id) =>
      index.albums[id] ? [{ ...index.albums[id], id }] : [],
    ),
    artists: favorites.artists.flatMap((id) =>
      index.artists[id] ? [{ ...index.artists[id], id }] : [],
    ),
  };
}
