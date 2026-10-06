import type { Metadata } from 'next';
import { AlbumShelf } from '@/components/album-grid';
import { decades } from '@/lib/catalog';
import { Heading } from '@/components/heading';

export const metadata: Metadata = { title: '年代' };

export default function DecadesPage() {
  return (
    <>
      <div className="pt-4">
        <Heading as="h1" size="page" eyebrow="Decades">
          年代
        </Heading>
      </div>
      {decades.map(({ decade, albums }) => (
        <AlbumShelf
          key={decade}
          title={`${decade}年代`}
          eyebrow={`The ${decade}s`}
          href={`/decades/${decade}`}
          albums={albums}
        />
      ))}
    </>
  );
}
