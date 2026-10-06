import type { Metadata } from 'next';
import { AlbumGrid } from '@/components/album-grid';
import { albumsByNewest } from '@/lib/catalog';
import { Heading } from '@/components/heading';

export const metadata: Metadata = { title: 'アルバム' };

export default function AlbumsPage() {
  return (
    <>
      <div className="pt-4 pb-6">
        <Heading as="h1" size="page" eyebrow="Albums">
          アルバム
        </Heading>
      </div>
      <AlbumGrid albums={albumsByNewest} />
    </>
  );
}
