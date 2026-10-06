import type { Metadata } from 'next';
import { AlbumGrid } from '@/components/album-grid';
import { albumsByNewest } from '@/lib/catalog';

export const metadata: Metadata = { title: 'アルバム' };

export default function AlbumsPage() {
  return (
    <>
      <h1 className="pt-4 pb-6 text-3xl font-bold">アルバム</h1>
      <AlbumGrid albums={albumsByNewest} />
    </>
  );
}
