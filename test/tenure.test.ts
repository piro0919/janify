import { describe, expect, it } from 'vitest';
import { inTenure, type Album, type Artist } from '@/lib/catalog';
import { parseTenure } from '../scripts/lib/tenure';

describe('ジャニーズ在籍の読み方', () => {
  it('期間・いまも所属・複数の期間・なし・空を読む', () => {
    expect(parseTenure('1971-1975')).toEqual([{ from: 1971, to: 1975 }]);
    expect(parseTenure('1995-')).toEqual([{ from: 1995, to: null }]);
    expect(parseTenure('1988-1995, 2022-2023')).toEqual([
      { from: 1988, to: 1995 },
      { from: 2022, to: 2023 },
    ]);
    expect(parseTenure('なし')).toEqual([]);
    expect(parseTenure(' ')).toBeNull();
  });

  it('読めない書き方は黙って捨てずに止める', () => {
    expect(() => parseTenure('1971年から')).toThrow();
  });
});

describe('所属していた間の作品か', () => {
  const album = (year: number | null) => ({ year }) as Album;
  const artist = (tenure: Artist['tenure']) => ({ tenure }) as Artist;

  it('期間の中だけを数える', () => {
    const a = artist([{ from: 1971, to: 1975 }]);
    expect(inTenure(a, album(1975))).toBe(true);
    expect(inTenure(a, album(1976))).toBe(false);
    expect(inTenure(a, album(null))).toBe(false);
  });

  it('いまも所属なら、それ以降はすべて数える', () => {
    expect(inTenure(artist([{ from: 1999, to: null }]), album(2026))).toBe(true);
  });

  it('作品が無い（なし）なら数えず、調べていないならすべて数える', () => {
    expect(inTenure(artist([]), album(2024))).toBe(false);
    expect(inTenure(artist(null), album(2024))).toBe(true);
  });
});
