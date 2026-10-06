import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { MusicGroup, WithContext } from 'schema-dts';
import { AlbumGrid } from '@/components/album-grid';
import { AmbientSource } from '@/components/ambient';
import { HeartButton } from '@/components/favorites/heart-button';
import { JsonLd } from '@/components/json-ld';
import { Shelf } from '@/components/shelf';
import { SongList } from '@/components/song-list';
import { artists, coverOf, findArtist, songsOf } from '@/lib/catalog';
import { SITE_URL } from '@/lib/site';
import { Heading } from '@/components/heading';

export function generateStaticParams() {
  return artists.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: PageProps<'/artists/[id]'>): Promise<Metadata> {
  const artist = findArtist((await params).id);
  return { title: artist?.name };
}

export default async function ArtistPage({ params }: PageProps<'/artists/[id]'>) {
  const artist = findArtist((await params).id);
  if (!artist) notFound();
  const cover = coverOf(artist.albums.flatMap((a) => a.tracks).toReversed());
  const jsonLd: WithContext<MusicGroup> = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: artist.name,
    url: `${SITE_URL}/artists/${artist.id}`,
    ...(cover && { image: cover }),
    album: artist.albums.map((a) => ({
      '@type': 'MusicAlbum',
      name: a.title,
      url: `${SITE_URL}/albums/${a.id}`,
    })),
  };
  const songs = songsOf(artist)
    .slice(0, 12)
    .map((s) => s.song);

  return (
    <>
      <JsonLd data={jsonLd} />
      <AmbientSource image={cover} />
      <div className="flex items-center gap-3 pt-4">
        <Heading as="h1" size="page" eyebrow="Artist">
          {artist.name}
        </Heading>
        <HeartButton
          kind="artists"
          itemKey={artist.id}
          label={artist.name}
          className="size-10"
          size="size-6"
        />
      </div>
      {songs.length > 0 && (
        <Shelf title="よく収録されている曲" eyebrow="Top Tracks">
          <SongList songs={songs} columns />
        </Shelf>
      )}
      <div className="mt-10 mb-4">
        <Heading eyebrow="Discography">アルバム</Heading>
      </div>
      <AlbumGrid
        albums={artist.albums.toReversed().map((album) => ({ artist, album }))}
        showArtist={false}
      />
    </>
  );
}
