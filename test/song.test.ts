import { describe, expect, it } from 'vitest';
import { bareTitle, norm, songKey } from '../scripts/lib/song';

describe('norm', () => {
  it('全角半角と大小をそろえる', () => {
    expect(norm('ＬＯＶＥ Ｓｏｎｇ')).toBe(norm('love song'));
  });

  it('記号と空白の違いを無視する', () => {
    expect(norm('Can do! Can go!')).toBe(norm('Can do, Can go'));
    expect(norm('「青春アミーゴ」')).toBe(norm('青春アミーゴ'));
    expect(norm('Ｗｈａｔ’ｓ　ｕｐ？')).toBe(norm("what's up"));
  });

  it('文字そのものが違えば別の曲', () => {
    expect(norm('シアワセ')).not.toBe(norm('しあわせ'));
  });
});

describe('bareTitle', () => {
  it('末尾の注記を外す', () => {
    expect(bareTitle('Real Face (Album ver.)')).toBe('Real Face');
    expect(bareTitle('ガラスの十代（2023 Remaster）')).toBe('ガラスの十代');
    expect(bareTitle('夜空ノムコウ [Live]')).toBe('夜空ノムコウ');
  });

  it('途中の括弧は残す', () => {
    expect(bareTitle('(What A) Wonderful World')).toBe('(What A) Wonderful World');
  });

  it('外すのは末尾の1つだけ', () => {
    expect(bareTitle('A (B) (C)')).toBe('A (B)');
  });
});

describe('songKey', () => {
  it('同じアーティストの同じ曲は、注記や表記が違っても同じ鍵になる', () => {
    expect(songKey('嵐', 'Love so sweet')).toBe(
      songKey('嵐', 'Ｌｏｖｅ　ｓｏ　ｓｗｅｅｔ (Album ver.)'),
    );
  });

  it('アーティストが違えば別の鍵', () => {
    expect(songKey('嵐', 'Happiness')).not.toBe(songKey('KAT-TUN', 'Happiness'));
  });
});
