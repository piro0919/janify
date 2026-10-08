'use client';

import { ARTIST_SHELF_ITEM, CoverCard, SHELF_ITEM } from '../cover-card';
import { Shelf } from '../shelf';
import { SongList } from '../song-list';
import { useLibrary } from './use-library';

/** トップの一番上に出すお気に入りの棚。お気に入りが無ければ何も出さない */
export function FavoriteShelves() {
  const { songs, albums, artists } = useLibrary();
  return (
    <>
      {songs.length > 0 && (
        <Shelf title="お気に入りの曲" eyebrow="Favorites" href="/library/songs">
          <SongList songs={songs.slice(0, 24)} favorites={songs} columns />
        </Shelf>
      )}
      {albums.length > 0 && (
        <Shelf title="お気に入りのアルバム" eyebrow="Favorite Albums" href="/library">
          {albums.slice(0, 20).map((a, i) => (
            <CoverCard
              key={a.id}
              eager={i < 5}
              href={`/albums/${a.id}`}
              playing={{ albumId: a.id }}
              cover={a.cover}
              title={a.title}
              sub={[a.artistName, a.year && `${a.year}年`].filter(Boolean).join(' ・ ')}
              className={SHELF_ITEM}
            />
          ))}
        </Shelf>
      )}
      {artists.length > 0 && (
        <Shelf title="お気に入りのアーティスト" eyebrow="Favorite Artists" href="/library">
          {artists.slice(0, 20).map((a, i) => (
            <CoverCard
              key={a.id}
              eager={i < 5}
              href={`/artists/${a.id}`}
              playing={{ artistId: a.id }}
              cover={a.cover}
              round
              title={a.name}
              sub={a.sub}
              className={ARTIST_SHELF_ITEM}
            />
          ))}
        </Shelf>
      )}
    </>
  );
}
