import type { Metadata } from 'next';
import { AlbumShelf } from '@/components/album-grid';
import { decades } from '@/lib/catalog';
import { PlayingAmbient } from '@/components/playing-ambient';

export const metadata: Metadata = { title: '年代' };

export default function DecadesPage() {
  return (
    <>
      <PlayingAmbient />
      <h1 className="pt-4 text-3xl font-bold">年代</h1>
      {decades.map(({ decade, albums }) => (
        <AlbumShelf
          key={decade}
          title={`${decade}年代`}
          href={`/decades/${decade}`}
          albums={albums}
        />
      ))}
    </>
  );
}
