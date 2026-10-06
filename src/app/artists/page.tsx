import type { Metadata } from 'next';
import { COVER_GRID, CoverCard } from '@/components/cover-card';
import { artists, coverOf } from '@/lib/catalog';
import { PlayingAmbient } from '@/components/playing-ambient';

export const metadata: Metadata = { title: 'アーティスト' };

export default function ArtistsPage() {
  return (
    <>
      <PlayingAmbient />
      <h1 className="pt-4 pb-6 text-3xl font-bold">アーティスト</h1>
      <div className={COVER_GRID}>
        {artists.map((artist, i) => (
          <CoverCard
            key={artist.id}
            href={`/artists/${artist.id}`}
            playing={{ artistId: artist.id }}
            cover={coverOf(artist.albums.flatMap((a) => a.tracks).toReversed())}
            title={artist.name}
            sub={`アルバム ${artist.albums.length} 枚`}
            eager={i < 10}
          />
        ))}
      </div>
    </>
  );
}
