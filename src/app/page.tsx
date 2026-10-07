import type { WebSite, WithContext } from 'schema-dts';
import { AlbumShelf } from '@/components/album-grid';
import { ARTIST_SHELF_ITEM, CoverCard } from '@/components/cover-card';
import { FavoriteShelves } from '@/components/favorites/favorite-shelves';
import { JsonLd } from '@/components/json-ld';
import { Shelf } from '@/components/shelf';
import { SongList } from '@/components/song-list';
import { albumsByNewest, artists, decades, popularSongs } from '@/lib/catalog';
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
      <FavoriteShelves />
      <Shelf title="人気曲" eyebrow="Popular">
        {/* トップでお気に入りを外せても使い道が薄いので、ハートは出さない。入れるのはアルバムの画面や検索から */}
        <SongList songs={popularSongs(24)} columns hearts={false} />
      </Shelf>

      <AlbumShelf
        title="新しいアルバム"
        eyebrow="New Releases"
        href="/albums"
        albums={albumsByNewest}
        eager
      />

      <Shelf title="アーティスト" eyebrow="Artists" href="/artists">
        {artists.map((artist) => (
          <CoverCard
            key={artist.id}
            href={`/artists/${artist.id}`}
            playing={{ artistId: artist.id }}
            cover={artist.icon}
            round
            title={artist.name}
            sub={`アルバム ${artist.albums.length} 枚`}
            className={ARTIST_SHELF_ITEM}
          />
        ))}
      </Shelf>

      {decades.map(({ decade, albums }) => (
        <AlbumShelf
          key={decade}
          title={`${decade}年代`}
          eyebrow={`The ${decade}s`}
          href={`/decades/${decade}`}
          albums={albums}
        />
      ))}
    </>
  );
}
