import type { AlbumEntry } from '@/lib/catalog';
import { coverOf, queueOf } from '@/lib/catalog';
import { COVER_GRID, CoverCard, SHELF_ITEM } from './cover-card';
import { Shelf } from './shelf';

/** アルバムを敷き詰める一覧。アーティスト名を添えるかどうかを選べる */
export function AlbumGrid({
  albums,
  showArtist = true,
}: {
  albums: AlbumEntry[];
  showArtist?: boolean;
}) {
  return (
    <div className={COVER_GRID}>
      {albums.map(({ artist, album }, i) => (
        <CoverCard
          key={album.id}
          href={`/albums/${album.id}`}
          playing={{ albumId: album.id }}
          play={queueOf(artist, album)[0]}
          cover={coverOf(album.tracks)}
          title={album.title}
          sub={[showArtist && artist.name, album.year && `${album.year}年`]
            .filter(Boolean)
            .join(' ・ ')}
          eager={i < 10}
        />
      ))}
    </div>
  );
}

/** アルバムを並べた棚。棚1段に並べるのは20枚までで、残りは「すべて表示」の先で見る */
export function AlbumShelf({
  title,
  href,
  albums,
  eager,
}: {
  title: string;
  href?: string;
  albums: AlbumEntry[];
  eager?: boolean;
}) {
  return (
    <Shelf title={title} href={href}>
      {albums.slice(0, 20).map(({ artist, album }, i) => (
        <CoverCard
          key={album.id}
          href={`/albums/${album.id}`}
          playing={{ albumId: album.id }}
          play={queueOf(artist, album)[0]}
          cover={coverOf(album.tracks)}
          title={album.title}
          sub={[artist.name, album.year && `${album.year}年`].filter(Boolean).join(' ・ ')}
          eager={eager && i < 5}
          className={SHELF_ITEM}
        />
      ))}
    </Shelf>
  );
}
