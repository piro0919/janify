import type { Metadata } from 'next';
import { AlbumGrid } from '@/components/album-grid';
import { albumsByNewest } from '@/lib/catalog';
import { PlayingAmbient } from '@/components/playing-ambient';

export const metadata: Metadata = { title: 'アルバム' };

export default function AlbumsPage() {
  return (
    <>
      <PlayingAmbient />
      <h1 className="pt-4 pb-6 text-3xl font-bold">アルバム</h1>
      <AlbumGrid albums={albumsByNewest} />
    </>
  );
}
