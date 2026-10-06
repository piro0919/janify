import type { Metadata } from 'next';
import { COVER_GRID, CoverCard } from '@/components/cover-card';
import { artists, coverOf } from '@/lib/catalog';
import { Heading } from '@/components/heading';

export const metadata: Metadata = { title: 'アーティスト' };

export default function ArtistsPage() {
  return (
    <>
      <div className="pt-4 pb-6">
        <Heading as="h1" size="page" eyebrow="Artists">
          アーティスト
        </Heading>
      </div>
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
