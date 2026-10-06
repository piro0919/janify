import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { MusicAlbum, WithContext } from 'schema-dts';
import { AlbumPlayer } from '@/components/album-player';
import { Ambient } from '@/components/ambient';
import { JsonLd } from '@/components/json-ld';
import { artists, coverOf, findAlbum, queueOf } from '@/lib/catalog';
import { SITE_URL } from '@/lib/site';

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
  const cover = coverOf(album.tracks);

  const jsonLd: WithContext<MusicAlbum> = {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: album.title,
    url: `${SITE_URL}/albums/${album.id}`,
    ...(cover && { image: cover }),
    ...(album.year && { datePublished: String(album.year) }),
    byArtist: { '@type': 'MusicGroup', name: artist.name, url: `${SITE_URL}/artists/${artist.id}` },
    numTracks: album.tracks.length,
    track: album.tracks.map((t, i) => ({
      '@type': 'MusicRecording',
      name: t.title,
      position: i + 1,
    })),
  };

  return (
    <div className="pt-4">
      <JsonLd data={jsonLd} />
      <Ambient image={cover} />
      <AlbumPlayer
        // 題名は動画の下に出す（YouTube の動画のページと同じ並び）
        heading={
          <>
            <h1 className="text-2xl font-bold sm:text-3xl">{album.title}</h1>
            <p className="mt-1 text-muted">
              <Link
                href={`/artists/${artist.id}`}
                className="hover:text-foreground hover:underline"
              >
                {artist.name}
              </Link>
              {album.year && ` ・ ${album.year}年`}
            </p>
          </>
        }
        albumId={album.id}
        albumTitle={album.title}
        tracks={album.tracks}
        queue={queueOf(artist, album)}
        cover={cover}
      />
    </div>
  );
}
