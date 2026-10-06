import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlbumPlayer } from '@/components/album-player';
import { artists, coverOf, findAlbum, queueOf } from '@/lib/catalog';

export function generateStaticParams() {
  return artists.flatMap((artist) => artist.albums.map((a) => ({ id: a.id })));
}

export async function generateMetadata({ params }: PageProps<'/albums/[id]'>): Promise<Metadata> {
  const found = findAlbum((await params).id);
  return { title: found && `${found.album.title} - ${found.artist.name}` };
}

export default async function AlbumPage({ params }: PageProps<'/albums/[id]'>) {
  const found = findAlbum((await params).id);
  if (!found) notFound();
  const { artist, album } = found;

  return (
    <div className="pt-4">
      <p className="text-xs font-bold text-muted">アルバム</p>
      <h1 className="mt-1 text-3xl font-bold">{album.title}</h1>
      <p className="mb-6 text-muted">
        <Link href={`/artists/${artist.id}`} className="hover:text-foreground hover:underline">
          {artist.name}
        </Link>
        {album.year && ` ・ ${album.year}年`}
      </p>
      <AlbumPlayer
        albumId={album.id}
        tracks={album.tracks}
        queue={queueOf(artist, album)}
        cover={coverOf(album.tracks)}
      />
    </div>
  );
}
