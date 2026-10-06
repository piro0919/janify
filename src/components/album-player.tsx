'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import type { QueueItem, Track } from '@/lib/catalog';
import { songKeyOf } from '@/lib/library';
import { FadeImage } from './fade-image';
import { HeartButton } from './favorites/heart-button';
import { Icon } from './icon';
import { Bars } from './now-playing';
import { usePlayer } from './player/player-provider';

/**
 * アルバムの画面。左に大きなプレイヤーの置き場所、右に曲目。
 * このアルバムの曲を流している間は、共通のプレイヤーが置き場所に重なって大きく出る。
 * ほかの曲を流しているあいだや、まだ何も流していないときは、サムネイルと再生ボタンを出す
 */
export function AlbumPlayer({
  albumId,
  albumTitle,
  heading,
  tracks,
  queue,
  cover,
}: {
  albumId: string;
  albumTitle: string;
  /** 動画の下に出す題名・アーティスト・年。リンクを含むのでページの側で作る */
  heading: ReactNode;
  tracks: Track[];
  queue: QueueItem[];
  cover: string | null;
}) {
  const {
    current,
    playing,
    queue: playingQueue,
    playQueue,
    adoptQueue,
    toggle,
    setSlot,
  } = usePlayer();
  const here = current?.albumId === albumId;
  const slot = useRef<HTMLDivElement>(null);

  // 曲の一覧から押して来たときは、その1曲だけを流している。曲は止めずに、順番待ちをこのアルバムの曲目にする
  useEffect(() => {
    if (!here || !current || playingQueue.length !== 1) return;
    const at = queue.findIndex((q) => q.videoId === current.videoId);
    if (at >= 0 && queue.length > 1) adoptQueue(queue, at);
  }, [here, current, playingQueue.length, queue, adoptQueue]);

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
    // 曲目が長くても動画が隠れないよう、動画の側は上に貼り付ける（sticky）。
    // パソコンでは動画と再生ボタンの列ごと、スマホでは動画だけを、ヘッダーのすぐ下に貼り付ける。
    // スマホで動画だけを貼り付けるため、列の箱（contents）を消して、動画をこの箱の直下の子にする
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
      <div className="contents lg:sticky lg:top-20 lg:block">
        {here ? (
          // 共通のプレイヤーがここに重なる（player-provider.tsx が位置を合わせる）。中には何も置かない
          <div
            ref={slot}
            className="aspect-video w-full rounded-lg bg-black max-lg:sticky max-lg:top-16 max-lg:z-10"
          />
        ) : (
          <button
            type="button"
            onClick={() => start()}
            aria-label="このアルバムを再生"
            className="group relative block aspect-video w-full overflow-hidden rounded-lg bg-surface"
          >
            {cover && (
              <FadeImage
                src={cover}
                alt=""
                fill
                loading="eager"
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover"
              />
            )}
            {/* サムネイルの上に重ねてよいのは再生ボタンだけ（YouTube の規約） */}
            <span className="absolute top-1/2 left-1/2 grid size-16 -translate-1/2 place-items-center rounded-full bg-accent text-background shadow-lg transition-[scale] duration-200 ease-out group-hover:scale-105 group-active:scale-95">
              <Icon name="play" className="size-9" />
            </span>
          </button>
        )}
        <div className="lg:mt-4">{heading}</div>
        <div className="flex items-center gap-3 lg:mt-4">
          <button
            type="button"
            onClick={() => (here ? toggle() : start())}
            className="flex items-center gap-2 rounded-full bg-foreground py-2 pr-5 pl-4 text-sm font-bold text-background transition-[opacity,scale] duration-150 ease-out hover:opacity-90 active:scale-95"
          >
            <Icon name={here && playing ? 'pause' : 'play'} className="size-5" />
            {here && playing ? '一時停止' : '再生'}
          </button>
          <HeartButton
            kind="albums"
            itemKey={albumId}
            label={albumTitle}
            className="size-10"
            size="size-6"
          />
          <span className="text-sm text-muted">
            {queue.length} 曲{queue.length < tracks.length && `（全 ${tracks.length} 曲）`}
          </span>
        </div>
      </div>

      <ol>
        {tracks.map((track, i) => {
          const active = here && current?.videoId === track.videoId;
          return (
            <li
              key={i}
              className={`group flex items-center rounded-md pr-1 transition-colors duration-150 ${
                active ? 'bg-surface' : track.videoId ? 'hover:bg-surface' : ''
              }`}
            >
              <button
                type="button"
                disabled={!track.videoId}
                title={
                  track.videoId
                    ? undefined
                    : 'この曲は YouTube で動画が見つかっていないため、再生できません'
                }
                onClick={() => track.videoId && start(track.videoId)}
                className={`flex min-w-0 flex-1 items-center gap-4 px-3 py-2.5 text-left ${
                  active ? 'text-accent' : ''
                } disabled:cursor-default disabled:text-muted/50`}
              >
                <span className="flex w-6 shrink-0 justify-end text-sm tabular-nums text-muted">
                  {active ? <Bars playing={playing} /> : i + 1}
                </span>
                <span className="truncate">{track.title}</span>
                {!track.videoId && <span className="ml-auto shrink-0 text-xs">動画なし</span>}
              </button>
              {track.videoId && (
                <HeartButton
                  kind="songs"
                  itemKey={songKeyOf({ albumId, title: track.title })}
                  label={track.title}
                  className="size-8"
                  quiet
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
