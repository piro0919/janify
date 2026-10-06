import { CoverCard } from "@/components/cover-card";
import { artists, coverOf } from "@/lib/catalog";

export default function Home() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 pt-4 sm:grid-cols-3 lg:grid-cols-5">
      {artists.map((artist, i) => (
        <CoverCard
          key={artist.id}
          href={`/artists/${artist.id}`}
          cover={coverOf(artist.albums.flatMap((a) => a.tracks).toReversed())}
          title={artist.name}
          sub={`アルバム ${artist.albums.length} 枚`}
          eager={i < 5}
        />
      ))}
    </div>
  );
}
