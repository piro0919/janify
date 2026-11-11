import { describe, expect, it } from 'vitest';
import { decodeEntities, pickUnofficial } from '../scripts/lib/unofficial-pick';

const v = (title: string) => ({ id: { videoId: title }, snippet: { title, channelTitle: 'x' } });
const pick = (titles: string[], loose: boolean) =>
  pickUnofficial(titles.map(v), 'SMAP', '青いイナズマ', loose)?.snippet.title;

describe('非公式の動画の選び方', () => {
  const live = '1998 012 SMAP TOUR LIVE AMIGOS! - 青いイナズマ';

  it('厳しく選ぶときは、ライブの映像のように残りが長いものを取らない', () => {
    expect(pick([live], false)).toBeUndefined();
    expect(pick([live, 'SMAP 青いイナズマ'], false)).toBe('SMAP 青いイナズマ');
  });

  it('緩めて選ぶときは、ライブの映像も取る', () => {
    expect(pick([live], true)).toBe(live);
  });

  it('緩めて選んでも、本人の歌でないものとメドレーは取らない', () => {
    expect(
      pick(
        ['SMAP 青いイナズマ 歌ってみた', 'SMAP メドレー 青いイナズマ〜SHAKE〜ダイナマイト'],
        true,
      ),
    ).toBeUndefined();
  });

  it('HTML の書き方で返ってきた題名を戻してから比べる', () => {
    const items = [v('タッキー&amp;翼 - Crazy Rainbow')];
    expect(pickUnofficial(items, 'タッキー&翼', 'Crazy Rainbow', false)?.snippet.title).toBe(
      'タッキー&翼 - Crazy Rainbow',
    );
    expect(decodeEntities('Can&#39;t &quot;Stop&quot; &#x2661;')).toBe('Can\'t "Stop" ♡');
  });

  it('アーティスト名か曲名が題名に無いものは取らない', () => {
    expect(pick(['1998 TOUR LIVE - 青いイナズマ', 'SMAP LIVE 夜空ノムコウ'], true)).toBeUndefined();
  });
});
