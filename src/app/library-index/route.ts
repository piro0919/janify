import { artists, coverOf, queueOf } from '@/lib/catalog';
import { type LibraryIndex, songKeyOf } from '@/lib/library';

// ビルドのときに一度だけ作り、静的なファイルとして配る。お気に入りがある人だけが取りに来る
export const dynamic = 'force-static';

export function GET() {
  const index: LibraryIndex = { songs: {}, albums: {}, artists: {} };
  for (const artist of artists) {
    index.artists[artist.id] = {
      name: artist.name,
      cover: coverOf(artist.albums.flatMap((a) => a.tracks).toReversed()),
      albums: artist.albums.length,
    };
    for (const album of artist.albums) {
      index.albums[album.id] = {
        title: album.title,
        year: album.year,
        artistName: artist.name,
        cover: coverOf(album.tracks),
      };
      for (const song of queueOf(artist, album)) index.songs[songKeyOf(song)] = song;
    }
  }
  return Response.json(index);
}
