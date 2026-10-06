'use client';

import Image from 'next/image';
import { type QueueItem, thumbOf } from '@/lib/catalog';
import { usePlayer } from './player/player-provider';

/** 小さなサムネイルと曲名を詰めて並べる一覧。押すとこの一覧を順番待ちにして、その曲から流す */
export function SongList({ songs, columns }: { songs: QueueItem[]; columns?: boolean }) {
  const { current, playQueue } = usePlayer();
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
            className={`flex min-w-0 snap-start items-center gap-3 rounded-md p-1.5 text-left hover:bg-surface ${active ? 'bg-surface' : ''}`}
          >
            <Image
              src={thumbOf(song.videoId)}
              alt=""
              width={85}
              height={48}
              className="aspect-video shrink-0 rounded"
            />
            <span className="min-w-0">
              <span className={`block truncate text-sm font-bold ${active ? 'text-accent' : ''}`}>
                {song.title}
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
