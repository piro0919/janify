'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import type { QueueItem, Track } from '@/lib/catalog';
import { Icon } from './icon';
import { usePlayer } from './player/player-provider';

/**
 * アルバムの画面。左に大きなプレイヤーの置き場所、右に曲目。
 * このアルバムの曲を流している間は、共通のプレイヤーが置き場所に重なって大きく出る。
 * ほかの曲を流しているあいだや、まだ何も流していないときは、サムネイルと再生ボタンを出す
 */
export function AlbumPlayer({
  albumId,
  tracks,
  queue,
  cover,
}: {
  albumId: string;
  tracks: Track[];
  queue: QueueItem[];
  cover: string | null;
}) {
  const { current, playing, playQueue, toggle, setSlot } = usePlayer();
  const here = current?.albumId === albumId;
  const slot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!here) return;
    setSlot(slot.current);
    return () => setSlot(null);
  }, [here, setSlot]);

  const start = (videoId?: string) =>
    playQueue(
      queue,
      videoId
        ? Math.max(
            0,
            queue.findIndex((q) => q.videoId === videoId),
          )
        : 0,
    );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div>
        {here ? (
          // 共通のプレイヤーがここに重なる。中には何も置かない
          <div ref={slot} className="aspect-video w-full rounded-lg bg-black" />
        ) : (
          <button
            type="button"
            onClick={() => start()}
            aria-label="このアルバムを再生"
            className="group relative block aspect-video w-full overflow-hidden rounded-lg bg-surface"
          >
            {cover && (
              <Image
                src={cover}
                alt=""
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover"
              />
            )}
            {/* サムネイルの上に重ねてよいのは再生ボタンだけ（YouTube の規約） */}
            <span className="absolute top-1/2 left-1/2 grid size-16 -translate-1/2 place-items-center rounded-full bg-accent text-background shadow-lg transition-transform group-hover:scale-105">
              <Icon name="play" className="size-9" />
            </span>
          </button>
        )}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => (here ? toggle() : start())}
            className="flex items-center gap-2 rounded-full bg-foreground py-2 pr-5 pl-4 text-sm font-bold text-background hover:opacity-90"
          >
            <Icon name={here && playing ? 'pause' : 'play'} className="size-5" />
            {here && playing ? '一時停止' : '再生'}
          </button>
          <span className="text-sm text-muted">
            {queue.length} 曲{queue.length < tracks.length && `（全 ${tracks.length} 曲）`}
          </span>
        </div>
      </div>

      <ol className="self-start">
        {tracks.map((track, i) => {
          const active = here && current?.videoId === track.videoId;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={!track.videoId}
                onClick={() => track.videoId && start(track.videoId)}
                className={`flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-left ${
                  active ? 'bg-surface text-accent' : 'hover:bg-surface'
                } disabled:cursor-default disabled:text-muted/50 disabled:hover:bg-transparent`}
              >
                <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted">
                  {i + 1}
                </span>
                <span className="truncate">{track.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
