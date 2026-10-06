import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AlbumGrid } from '@/components/album-grid';
import { HeartButton } from '@/components/favorites/heart-button';
import { Shelf } from '@/components/shelf';
import { SongList } from '@/components/song-list';
import { artists, findArtist, songsOf } from '@/lib/catalog';

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
  const songs = songsOf(artist)
    .slice(0, 12)
    .map((s) => s.song);

  return (
    <>
      <div className="flex items-center gap-3 pt-4">
        <h1 className="text-3xl font-bold">{artist.name}</h1>
        <HeartButton
          kind="artists"
          itemKey={artist.id}
          label={artist.name}
          className="size-10"
          size="size-6"
        />
      </div>
      {songs.length > 0 && (
        <Shelf title="よく収録されている曲">
          <SongList songs={songs} columns />
        </Shelf>
      )}
      <h2 className="mt-10 mb-4 text-xl font-bold sm:text-2xl">アルバム</h2>
      <AlbumGrid
        albums={artist.albums.toReversed().map((album) => ({ artist, album }))}
        showArtist={false}
      />
    </>
  );
}
