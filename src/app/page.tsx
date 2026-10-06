import type { WebSite, WithContext } from 'schema-dts';
import { AlbumShelf } from '@/components/album-grid';
import { CoverCard, SHELF_ITEM } from '@/components/cover-card';
import { FavoriteShelves } from '@/components/favorites/favorite-shelves';
import { PlayingAmbient } from '@/components/playing-ambient';
import { JsonLd } from '@/components/json-ld';
import { Shelf } from '@/components/shelf';
import { SongList } from '@/components/song-list';
import { albumsByNewest, artists, coverOf, decades, popularSongs } from '@/lib/catalog';
import { SITE_URL } from '@/lib/site';

/** サイトそのものの情報と、検索結果にサイト内の検索欄を出すための案内 */
const jsonLd: WithContext<WebSite> = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Janify',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/search?q={search_term_string}`,
    // schema-dts の型に query-input が無いので、文字列のキーで足す
    ...{ 'query-input': 'required name=search_term_string' },
  },
};

export default function Home() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <PlayingAmbient />
      <FavoriteShelves />
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
