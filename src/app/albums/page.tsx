import type { Metadata } from 'next';
import { AlbumGrid } from '@/components/album-grid';
import { albumsByNewest } from '@/lib/catalog';
import { Heading } from '@/components/heading';
import { canonical } from '@/lib/site';

export const metadata: Metadata = { title: 'アルバム', alternates: canonical('/albums') };

export default function AlbumsPage() {
  return (
    <>
      <div className="pt-4 pb-4 sm:pb-6">
        <Heading as="h1" size="page" eyebrow="Albums">
          アルバム
        </Heading>
      </div>
      <AlbumGrid albums={albumsByNewest} />
    </>
  );
}
