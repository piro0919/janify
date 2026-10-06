import { describe, expect, it } from 'vitest';
import {
  albumsByNewest,
  artists,
  coverOf,
  decades,
  findAlbum,
  findArtist,
  popularSongs,
  songsOf,
  type Track,
} from '@/lib/catalog';

// catalog.json は Notion から書き出したもの。書き出しや Notion の手直しで崩れていないかを見る
describe('書き出した catalog.json', () => {
  const albums = artists.flatMap((a) => a.albums);
  const tracks = albums.flatMap((a) => a.tracks);

  it('アーティストの id が重ならない', () => {
    expect(new Set(artists.map((a) => a.id)).size).toBe(artists.length);
  });

  it('アルバムの id が重ならない', () => {
    expect(new Set(albums.map((a) => a.id)).size).toBe(albums.length);
  });

  it('動画の id は YouTube の形', () => {
    const bad = tracks.filter((t) => t.videoId !== null && !/^[\w-]{11}$/.test(t.videoId));
    expect(bad).toEqual([]);
  });

  it('動画の種類は、動画があるときだけ入っている', () => {
    const bad = tracks.filter((t) => (t.videoId === null) !== (t.kind === null));
    expect(bad).toEqual([]);
  });

  // 再生できる曲が無いアルバムとアーティストは、書き出しのときに落とす決まり
  it('どのアルバムにも再生できる曲がある', () => {
    const empty = albums.filter((a) => !a.tracks.some((t) => t.videoId));
    expect(empty.map((a) => a.title)).toEqual([]);
  });

  it('どのアーティストにもアルバムがある', () => {
    expect(artists.filter((a) => a.albums.length === 0).map((a) => a.name)).toEqual([]);
  });
});

describe('findArtist・findAlbum', () => {
  const artist = artists[0];
  const album = artist.albums[0];

  it('id で引ける', () => {
    expect(findArtist(artist.id)).toBe(artist);
    expect(findAlbum(album.id)).toEqual({ artist, album });
  });

  it('無い id は undefined', () => {
    expect(findArtist('missing')).toBeUndefined();
    expect(findAlbum('missing')).toBeUndefined();
  });
});

describe('coverOf', () => {
  const t = (videoId: string | null, kind: Track['kind']): Track => ({ title: 't', videoId, kind });

  it('MV があれば、順番が後ろでも MV のサムネイル', () => {
    expect(coverOf([t('aaaaaaaaaaa', 'audio'), t('bbbbbbbbbbb', 'mv')])).toBe(
      'https://i.ytimg.com/vi/bbbbbbbbbbb/mqdefault.jpg',
    );
  });

  it('MV が無ければ、最初の動画のある曲', () => {
    expect(
      coverOf([t(null, null), t('ccccccccccc', 'unofficial'), t('ddddddddddd', 'audio')]),
    ).toBe('https://i.ytimg.com/vi/ccccccccccc/mqdefault.jpg');
  });

  it('動画が1つも無ければ null', () => {
    expect(coverOf([t(null, null)])).toBeNull();
  });
});

describe('人気曲と年代', () => {
  it('人気曲の1巡目は、アーティストが重ならない', () => {
    const songs = popularSongs(artists.length);
    expect(new Set(songs.map((s) => s.artistId)).size).toBe(songs.length);
  });

  it('人気曲に、歌の入っていない版を入れない', () => {
    const bad = popularSongs(200).filter((s) => /instrumental|karaoke|カラオケ/i.test(s.title));
    expect(bad).toEqual([]);
  });

  it('同じ曲は1つにまとめる', () => {
    for (const artist of artists) {
      const ids = songsOf(artist).map((s) => `${s.song.albumId}:${s.song.videoId}`);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('年代の棚には、その年代のアルバムだけが入る', () => {
    for (const { decade, albums } of decades) {
      const bad = albums.filter((e) => Math.floor((e.album.year ?? 0) / 10) * 10 !== decade);
      expect(bad).toEqual([]);
    }
  });

  // お気に入りの曲の鍵は「アルバムの id と曲名」。同じアルバムに同じ曲名があると、鍵が重なる
  it('同じアルバムの中で、再生できる曲の曲名が重ならない', () => {
    const bad = artists.flatMap((a) =>
      a.albums.filter((al) => {
        const titles = al.tracks.filter((t) => t.videoId).map((t) => t.title);
        return new Set(titles).size !== titles.length;
      }),
    );
    expect(bad.map((al) => al.title)).toEqual([]);
  });

  it('新しい順の一覧には、全アルバムが入る', () => {
    expect(albumsByNewest.length).toBe(artists.flatMap((a) => a.albums).length);
  });
});
