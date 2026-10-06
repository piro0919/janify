import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AlbumGrid } from '@/components/album-grid';
import { decades } from '@/lib/catalog';
import { PlayingAmbient } from '@/components/playing-ambient';

export const dynamicParams = false;

export function generateStaticParams() {
  return decades.map((d) => ({ decade: String(d.decade) }));
}

async function find(params: PageProps<'/decades/[decade]'>['params']) {
  const { decade } = await params;
  return decades.find((d) => String(d.decade) === decade);
}

export async function generateMetadata({
  params,
}: PageProps<'/decades/[decade]'>): Promise<Metadata> {
  const found = await find(params);
  return { title: found && `${found.decade}年代のアルバム` };
}

export default async function DecadePage({ params }: PageProps<'/decades/[decade]'>) {
  const found = await find(params);
  if (!found) notFound();
  return (
    <>
      <PlayingAmbient />
      <h1 className="pt-4 pb-6 text-3xl font-bold">{found.decade}年代</h1>
      <AlbumGrid albums={found.albums} />
    </>
  );
}
