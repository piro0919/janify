'use client';

import type { QueueItem } from '@/lib/catalog';
import { thumbOf } from '@/lib/thumb';
import { songKeyOf } from '@/lib/library';
import { HeartButton } from './favorites/heart-button';
import { FadeImage } from './fade-image';
import { Bars } from './now-playing';
import { usePlayer } from './player/player-provider';

/** 小さなサムネイルと曲名を詰めて並べる一覧。押すとこの一覧を順番待ちにして、その曲から流す */
export function SongList({ songs, columns }: { songs: QueueItem[]; columns?: boolean }) {
  const { current, playing, playQueue } = usePlayer();
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
        return (
          <div
            key={`${song.albumId}:${song.videoId}`}
            className={`group flex min-w-0 snap-start items-center rounded-md pr-1 transition-colors duration-150 hover:bg-surface ${active ? 'bg-surface' : ''}`}
          >
            <button
              type="button"
              onClick={() => playQueue(songs, i)}
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
                <span
                  className={`flex items-center gap-1.5 text-sm font-bold ${active ? 'text-accent' : ''}`}
                >
                  <span className="truncate">{song.title}</span>
                  {active && <Bars playing={playing} />}
                </span>
                <span className="block truncate text-xs text-muted">
                  {song.artistName} ・ {song.albumTitle}
                </span>
              </span>
            </button>
            <HeartButton
              kind="songs"
              itemKey={songKeyOf(song)}
              label={song.title}
              className="size-8"
              quiet
            />
          </div>
        );
      })}
    </div>
  );
}
