'use client';

import { useRef, useState } from 'react';
import { FadeImage } from '@/components/fade-image';
import { setFavoriteOrder } from '@/components/favorites/favorites-store';
import { HeartButton } from '@/components/favorites/heart-button';
import { useLibrary } from '@/components/favorites/use-library';
import { Icon } from '@/components/icon';
import { Bars } from '@/components/now-playing';
import { PlayerStage } from '@/components/player-stage';
import { PlaybackMode } from '@/components/player/playback-mode';
import { usePlayer } from '@/components/player/player-provider';
import type { QueueItem } from '@/lib/catalog';
import { songKeyOf } from '@/lib/library';
import { thumbOf } from '@/lib/thumb';
import { Heading } from '@/components/heading';
import { Marquee } from '@/components/marquee';

/**
 * お気に入りの曲の画面。お気に入りの曲を1本のプレイリストとして扱う（アルバムの画面と同じ作り）。
 * 押した曲は、この画面のまま、お気に入りの並び順に流れる。つまみをドラッグすると並べ替えられ、その順がそのまま再生順になる。
 * ハートで外した曲は、その場で一覧から消える
 */
export function FavoriteSongs() {
  const { ready, songs } = useLibrary();
  const { current, playing, context, playQueue, toggle } = usePlayer();
  const [dragging, setDragging] = useState<{ key: string; order: string[] } | null>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());

  // ドラッグ中は、指の位置に合わせて並べ替えた順で出す
  const shown = dragging
    ? dragging.order.flatMap((k) => songs.find((s) => songKeyOf(s) === k) ?? [])
    : songs;
  const here = context === 'favorites' && !!current;

  const play = (song?: QueueItem) => {
    const at = song ? songs.findIndex((s) => songKeyOf(s) === songKeyOf(song)) : 0;
    playQueue(songs, Math.max(0, at), 'favorites');
  };

  const commit = (order: string[]) => setFavoriteOrder('songs', order);

  /** 指の高さから、何番目に入れるかを決める。各行の真ん中より上なら、その行の前 */
  const targetIndex = (order: string[], key: string, clientY: number) => {
    const others = order.filter((k) => k !== key);
    let at = others.length;
    for (let i = 0; i < others.length; i++) {
      const el = rows.current.get(others[i]);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (clientY < r.top + r.height / 2) {
        at = i;
        break;
      }
    }
    const next = [...others];
    next.splice(at, 0, key);
    return next;
  };

  if (!ready) return <p className="pt-8 text-muted">読み込んでいます…</p>;

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
      <div className="contents lg:sticky lg:top-20 lg:block">
        <PlayerStage
          active={here}
          cover={songs[0] ? thumbOf(songs[0].videoId) : null}
          label="お気に入りの曲を再生"
          onPlay={() => songs.length > 0 && play()}
        />
        <div className="lg:mt-4">
          <Heading as="h1" size="page" eyebrow="Favorites">
            お気に入りの曲
          </Heading>
          <p className="mt-1 text-muted">{songs.length} 曲</p>
        </div>
        <div className="flex items-center gap-3 lg:mt-4">
          <button
            type="button"
            disabled={songs.length === 0}
            onClick={() => (here ? toggle() : play())}
            className="flex shrink-0 items-center gap-2 rounded-full bg-foreground py-2 pr-5 pl-4 text-sm font-bold whitespace-nowrap text-background transition-[opacity,scale] duration-150 ease-out hover:opacity-90 active:scale-95 disabled:opacity-40"
          >
            <Icon name={here && playing ? 'pause' : 'play'} className="size-5" />
            {here && playing ? '一時停止' : '再生'}
          </button>
          {/* スマホは下の帯にランダムとループが入りきらないので、ここに置く */}
          <PlaybackMode className="md:hidden" />
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-muted">まだお気に入りの曲がありません。</p>
      ) : (
        <ol>
          {shown.map((song, i) => {
            const key = songKeyOf(song);
            const active =
              here && current?.videoId === song.videoId && current.albumId === song.albumId;
            const lifted = dragging?.key === key;
            return (
              <li
                key={key}
                ref={(el) => {
                  if (el) rows.current.set(key, el);
                  else rows.current.delete(key);
                }}
                className={`group flex items-center rounded-md pr-1 transition-colors duration-150 ${
                  lifted
                    ? 'bg-foreground/15 shadow-lg'
                    : active
                      ? 'bg-sidebar/60'
                      : 'hover:bg-foreground/8'
                }`}
              >
                {/* 並べ替えのつまみ。ドラッグで動かす。キーボードでは上下の矢印で1つずつ動かす */}
                <button
                  type="button"
                  aria-label={`${song.title}を並べ替え`}
                  className="grid h-12 w-8 shrink-0 cursor-grab touch-none place-items-center text-muted hover:text-foreground active:cursor-grabbing"
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setDragging({ key, order: songs.map(songKeyOf) });
                  }}
                  onPointerMove={(e) => {
                    if (!dragging) return;
                    setDragging({ key, order: targetIndex(dragging.order, key, e.clientY) });
                  }}
                  onPointerUp={() => {
                    if (dragging) commit(dragging.order);
                    setDragging(null);
                  }}
                  onPointerCancel={() => setDragging(null)}
                  onKeyDown={(e) => {
                    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
                    e.preventDefault();
                    const order = songs.map(songKeyOf);
                    const from = order.indexOf(key);
                    const to = from + (e.key === 'ArrowUp' ? -1 : 1);
                    if (to < 0 || to >= order.length) return;
                    order.splice(from, 1);
                    order.splice(to, 0, key);
                    commit(order);
                  }}
                >
                  <Icon name="drag" className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => play(song)}
                  className={`flex min-w-0 flex-1 items-center gap-3 py-1.5 pr-2 text-left ${
                    active ? 'font-bold' : ''
                  }`}
                >
                  <span className="flex w-6 shrink-0 justify-end text-sm tabular-nums text-muted">
                    {active ? <Bars playing={playing} /> : i + 1}
                  </span>
                  <FadeImage
                    src={thumbOf(song.videoId)}
                    alt=""
                    width={71}
                    height={40}
                    className="aspect-video shrink-0 rounded"
                  />
                  <span className="min-w-0">
                    <Marquee active={active} className="text-sm font-bold">
                      {song.title}
                    </Marquee>
                    <span className="block truncate text-xs text-muted">
                      {song.artistName} ・ {song.albumTitle}
                    </span>
                  </span>
                </button>
                <HeartButton kind="songs" itemKey={key} label={song.title} className="size-8" />
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
