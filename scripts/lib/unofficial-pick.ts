// 非公式の検索の結果から、曲の動画を1本選ぶ。scripts/unofficial.ts から使う
import { norm } from './song';

type Item = { id: { videoId: string }; snippet: { title: string; channelTitle: string } };

// 歌ってみた・演奏・カラオケ・反応動画などは本人の歌ではない
const NOT_ORIGINAL =
  /cover|カバー|歌ってみた|弾いてみた|叩いてみた|踊ってみた|piano|ピアノ|guitar|ギター|カラオケ|karaoke|instrumental|インスト|オルゴール|music box|8bit|耳コピ|練習|tutorial|react|リアクション|ハモ|アカペラ|a cappella|remix|ai\s*cover|比較|#shorts|解説|dance studio|tiktok/i;

// 緩めて選ぶときも、何曲もつないだものは1曲の動画にならない
const MEDLEY = /medley|メドレー/i;

/**
 * 題名にアーティスト名と曲名が両方入り、本人の歌のものを選ぶ。
 * - 厳しく選ぶ（loose が false）: アーティスト名と曲名を除いた残りが短いものだけ。
 *   「Love」が「Love so sweet」に当たったり、番組の切り抜きに当たったりするのを防ぐ
 * - 緩めて選ぶ（loose が true）: 残りが長くてもよい。ライブや番組の映像も取る。
 *   厳しく選んで当たらなかった曲にだけ使う。ないよりはある方がよい、という判断（2026-11-11）
 */
export function pickUnofficial(items: Item[], artist: string, title: string, loose: boolean) {
  const a = norm(artist);
  const s = norm(title);
  return items
    .map((v) => ({ ...v, snippet: { ...v.snippet, title: decodeEntities(v.snippet.title) } }))
    .find((v) => {
      const t = norm(v.snippet.title);
      if (!t.includes(a) || !t.includes(s) || NOT_ORIGINAL.test(v.snippet.title)) return false;
      if (loose) return !MEDLEY.test(v.snippet.title);
      return t.replace(a, '').replace(s, '').length <= 12;
    });
}

const ENTITIES: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };

/**
 * search.list は題名を HTML の書き方で返す（「タッキー&翼」が「タッキー&amp;翼」）。
 * 戻さないと、& や ' を含むアーティスト名・曲名が一致しない
 */
export const decodeEntities = (text: string) =>
  text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (m, e: string) =>
    e.startsWith('#x') || e.startsWith('#X')
      ? String.fromCodePoint(parseInt(e.slice(2), 16))
      : e.startsWith('#')
        ? String.fromCodePoint(Number(e.slice(1)))
        : (ENTITIES[e.toLowerCase()] ?? m),
  );
