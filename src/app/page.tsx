import { AlbumShelf } from '@/components/album-grid';
import { CoverCard, SHELF_ITEM } from '@/components/cover-card';
import { Shelf } from '@/components/shelf';
import { SongList } from '@/components/song-list';
import { albumsByNewest, artists, coverOf, decades, popularSongs } from '@/lib/catalog';

export default function Home() {
  return (
    <>
      <Shelf title="人気曲">
        <SongList songs={popularSongs(24)} columns />
      </Shelf>

      <AlbumShelf title="新しいアルバム" href="/albums" albums={albumsByNewest} eager />

      <Shelf title="アーティスト" href="/artists">
        {artists.map((artist) => (
          <CoverCard
            key={artist.id}
            href={`/artists/${artist.id}`}
            playing={{ artistId: artist.id }}
            cover={coverOf(artist.albums.flatMap((a) => a.tracks).toReversed())}
            title={artist.name}
            sub={`アルバム ${artist.albums.length} 枚`}
            className={SHELF_ITEM}
          />
        ))}
      </Shelf>

      {decades.map(({ decade, albums }) => (
        <AlbumShelf
          key={decade}
          title={`${decade}年代`}
          href={`/decades/${decade}`}
          albums={albums}
        />
      ))}
    </>
  );
}
