import { albumsByNewest, artists, coverOf, songsOf } from '@/lib/catalog';
import type { SearchIndex } from '@/lib/search';

// 検索の画面が読む索引。ビルドのときに一度だけ作り、静的なファイルとして配る。
// 全曲をページに埋め込むと重いので、検索の画面を開いたときだけ取りに来る
export const dynamic = 'force-static';

export function GET() {
  const index: SearchIndex = {
    artists: artists.map((a) => ({
      id: a.id,
      name: a.name,
      cover: a.icon,
      albums: a.albums.length,
    })),
    albums: albumsByNewest.map(({ artist, album }) => ({
      id: album.id,
      title: album.title,
      year: album.year,
      artistName: artist.name,
      cover: coverOf(album.tracks),
    })),
    songs: artists.flatMap((a) => songsOf(a).map((s) => s.song)),
  };
  return Response.json(index);
}
