import type { QueueItem } from './catalog';

/**
 * ライブラリの画面とトップのお気に入りの棚が読む索引。今掲載しているものだけが載る。
 * 削除の依頼で掲載を外した曲やアルバムは、お気に入りに鍵が残っていてもここで落ち、再生できない
 */
export type LibraryIndex = {
  /** 鍵は songKeyOf（アルバムの id と曲名） */
  songs: Record<string, QueueItem>;
  albums: Record<
    string,
    { title: string; year: number | null; artistName: string; cover: string | null }
  >;
  /** sub はカードの添え書き（「アルバム 5 枚」） */
  artists: Record<string, { name: string; cover: string | null; sub: string }>;
};

/**
 * お気に入りの曲の鍵。曲は収録ごとに別に扱う。同じ曲名でも、アルバムが違えば取り直しやリミックスのことがある。
 * 動画の id は Notion で差し替えると変わるので、鍵に使わない
 */
export function songKeyOf(song: { albumId: string; title: string }): string {
  return `${song.albumId}:${song.title}`;
}
