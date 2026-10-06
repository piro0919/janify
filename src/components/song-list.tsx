'use client';

import type { QueueItem } from '@/lib/catalog';
import { useRouter } from 'next/navigation';
import { thumbOf } from '@/lib/thumb';
import { songKeyOf } from '@/lib/library';
import { HeartButton } from './favorites/heart-button';
import { FadeImage } from './fade-image';
import { Bars } from './now-playing';
import { usePlayer } from './player/player-provider';

/**
 * 小さなサムネイルと曲名を詰めて並べる一覧。押すと曲の入ったアルバムの画面へ移り、その曲から流す
 * （YouTube Music・Amazon Music と同じ）。iPhone は押した瞬間の操作の中で再生を始めないと音が出ないので、
 * ここでその1曲を流し始め、順番待ちはアルバムの画面に着いてからアルバムの曲目に差し替える
 */
export function SongList({
  songs,
  columns,
  favorites,
  removed,
  hearts = true,
}: {
  songs: QueueItem[];
  columns?: boolean;
  /**
   * お気に入りの曲の全体。渡すと、押した曲はアルバムの画面ではなくお気に入りの画面へ移り、
   * お気に入りの並び順で流れる（トップやライブラリのお気に入りの棚。songs はその一部のこともある）
   */
  favorites?: QueueItem[];
  /** 開いているあいだに外したお気に入り（`songs:鍵`）。行を薄く出す */
  removed?: Set<string>;
  /**
   * 行のハートを出すか。お気に入りの棚（トップ・ライブラリ）は全部お気に入りなので出さない。
   * お気に入りの出し入れは、お気に入りの曲の画面でする
   */
  hearts?: boolean;
}) {
  const { current, playing, playQueue } = usePlayer();
  const router = useRouter();
  return (
    <div
      className={
        columns
          ? 'grid snap-start auto-cols-[minmax(17rem,22rem)] grid-flow-col gap-x-6 gap-y-1'
          : 'grid gap-1'
      }
      // 棚では4行ずつ縦に詰めて横へ流す。曲が少ないときは、その数だけの行にして隙間を作らない
      style={
        columns ? { gridTemplateRows: `repeat(${Math.min(4, songs.length)}, auto)` } : undefined
      }
    >
      {songs.map((song, i) => {
        const active = current?.videoId === song.videoId && current.albumId === song.albumId;
        const gone = removed?.has(`songs:${songKeyOf(song)}`);
        return (
          <div
            key={`${song.albumId}:${song.videoId}`}
            className={`group flex min-w-0 snap-start items-center rounded-md pr-1 transition-[background-color,opacity] duration-150 ${active ? 'bg-sidebar/60' : 'hover:bg-foreground/8'} ${gone ? 'opacity-50' : ''}`}
          >
            <button
              type="button"
              onClick={() => {
                if (favorites) {
                  const at = favorites.findIndex((f) => songKeyOf(f) === songKeyOf(song));
                  playQueue(favorites, Math.max(0, at), 'favorites');
                  router.push('/library/songs');
                } else {
                  playQueue([song], 0, 'pending');
                  router.push(`/albums/${song.albumId}`);
                }
              }}
              className="flex min-w-0 flex-1 items-center gap-3 p-1.5 text-left transition-[scale] duration-150 ease-out active:scale-[0.98]"
            >
              <FadeImage
                src={thumbOf(song.videoId)}
                alt=""
                // 最初の列は画面に入った時点で見えるので、遅延読み込みにしない
                loading={i < 8 ? 'eager' : 'lazy'}
                width={85}
                height={48}
                className="aspect-video shrink-0 rounded"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  <span className="truncate">{song.title}</span>
                  {active && <Bars playing={playing} />}
                </span>
                <span className="block truncate text-xs text-muted">
                  {song.artistName} ・ {song.albumTitle}
                </span>
              </span>
            </button>
            {hearts && (
              <HeartButton
                kind="songs"
                itemKey={songKeyOf(song)}
                label={song.title}
                className="size-8"
                quiet
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
