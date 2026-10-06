import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoverCard } from "@/components/cover-card";
import { artists, coverOf, findArtist } from "@/lib/catalog";

export function generateStaticParams() {
  return artists.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: PageProps<"/artists/[id]">): Promise<Metadata> {
  const artist = findArtist((await params).id);
  return { title: artist?.name };
}

export default async function ArtistPage({ params }: PageProps<"/artists/[id]">) {
  const artist = findArtist((await params).id);
  if (!artist) notFound();

  return (
    <>
      <h1 className="pt-4 pb-6 text-3xl font-bold">{artist.name}</h1>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
        {artist.albums.toReversed().map((album, i) => (
          <CoverCard
            key={album.id}
            href={`/albums/${album.id}`}
            cover={coverOf(album.tracks)}
            title={album.title}
            sub={album.year ? `${album.year}年` : undefined}
            eager={i < 5}
          />
        ))}
      </div>
    </>
  );
}
