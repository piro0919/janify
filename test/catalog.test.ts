import { describe, expect, it } from 'vitest';
import { artists, coverOf, findAlbum, findArtist, type Track } from '@/lib/catalog';

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
      'https://i.ytimg.com/vi/bbbbbbbbbbb/hqdefault.jpg',
    );
  });

  it('MV が無ければ、最初の動画のある曲', () => {
    expect(
      coverOf([t(null, null), t('ccccccccccc', 'unofficial'), t('ddddddddddd', 'audio')]),
    ).toBe('https://i.ytimg.com/vi/ccccccccccc/hqdefault.jpg');
  });

  it('動画が1つも無ければ null', () => {
    expect(coverOf([t(null, null)])).toBeNull();
  });
});
