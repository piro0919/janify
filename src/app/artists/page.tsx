import type { Metadata } from 'next';
import { ARTIST_GRID, CoverCard } from '@/components/cover-card';
import { artists, discographyOf } from '@/lib/catalog';
import { Heading } from '@/components/heading';
import { canonical } from '@/lib/site';

export const metadata: Metadata = { title: 'アーティスト', alternates: canonical('/artists') };

export default function ArtistsPage() {
  return (
    <>
      <div className="pt-4 pb-4 sm:pb-6">
        <Heading as="h1" size="page" eyebrow="Artists">
          アーティスト
        </Heading>
      </div>
      <div className={ARTIST_GRID}>
        {artists.map((artist, i) => (
          <CoverCard
            key={artist.id}
            href={`/artists/${artist.id}`}
            playing={{ artistId: artist.id }}
            cover={artist.icon}
            round
            title={artist.name}
            sub={discographyOf(artist)}
            eager={i < 10}
          />
        ))}
      </div>
    </>
  );
}
