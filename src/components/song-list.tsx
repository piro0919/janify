'use client';

import { type QueueItem, thumbOf } from '@/lib/catalog';
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
          ? 'grid snap-start auto-cols-[minmax(17rem,22rem)] grid-flow-col grid-rows-4 gap-x-6 gap-y-1'
          : 'grid gap-1'
      }
    >
      {songs.map((song, i) => {
        const active = current?.videoId === song.videoId && current.albumId === song.albumId;
        return (
          <button
            key={`${song.albumId}:${song.videoId}`}
            type="button"
            onClick={() => playQueue(songs, i)}
            className={`flex min-w-0 snap-start items-center gap-3 rounded-md p-1.5 text-left transition-[background-color,scale] duration-150 ease-out hover:bg-surface active:scale-[0.98] ${active ? 'bg-surface' : ''}`}
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
        );
      })}
    </div>
  );
}
