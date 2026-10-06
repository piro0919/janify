import catalog from '@/data/catalog.json';

// 正本は Notion。src/data/catalog.json は scripts/notion-export.ts が書き出したもので、手で直さない
export type VideoKind = 'mv' | 'audio' | 'unofficial';
export type Track = { title: string; videoId: string | null; kind: VideoKind | null };
export type Album = { id: string; title: string; year: number | null; tracks: Track[] };
export type Artist = { id: string; name: string; albums: Album[] };

export const artists = catalog as Artist[];

export function findArtist(id: string): Artist | undefined {
  return artists.find((a) => a.id === id);
}

export function findAlbum(id: string): { artist: Artist; album: Album } | undefined {
  for (const artist of artists) {
    const album = artist.albums.find((a) => a.id === id);
    if (album) return { artist, album };
  }
}

/** 一覧に出す絵。顔が映りやすい MV を先に探し、無ければ音源の絵（ジャケット）を使う */
export function coverOf(tracks: Track[]): string | null {
  const video = tracks.find((t) => t.kind === 'mv') ?? tracks.find((t) => t.videoId);
  return video?.videoId ? `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg` : null;
}
