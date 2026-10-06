'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { type QueueItem, thumbOf } from '@/lib/catalog';
import { songKeyOf } from '@/lib/library';
import { FadeImage } from '../fade-image';
import { HeartButton } from '../favorites/heart-button';
import { Icon } from '../icon';
import { type PlaybackTime, usePlayer } from './player-provider';

/**
 * 画面の下に出したままにする操作の帯。曲を選ぶと下からせり上がり、閉じると下へ消える。
 * 消えきるまでは最後の曲を出しておくので、item は今の曲ではなく「最後に出した曲」。
 * 最初の1曲でもせり上がって見えるよう、曲を選ぶ前から閉じた状態で置いておく
 */
export function PlayerBar({ item, open }: { item: QueueItem | null; open: boolean }) {
  const { queue, index, playing, loading, toggle, step, close, seek, time } = usePlayer();

  return (
    <div
      aria-hidden={!open}
      inert={!open}
      className={`fixed inset-x-0 bottom-14 z-30 h-16 border-t border-line bg-bar transition-[translate,opacity] duration-300 ease-(--ease-out) md:bottom-0 ${
        open ? '' : 'pointer-events-none translate-y-full opacity-0'
      }`}
    >
      <Progress time={time} playing={playing} onSeek={seek} />

      <div className="flex h-full items-center gap-3 px-3 sm:gap-4 sm:px-4">
        <div className="flex items-center sm:gap-1">
          <BarButton label="前の曲" disabled={index <= 0} onClick={() => step(-1)}>
            <Icon name="prev" />
          </BarButton>
          <BarButton
            label={playing ? '一時停止' : '再生'}
            large
            onClick={toggle}
            disabled={loading}
          >
            {loading ? (
              <span className="size-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
            ) : (
              <Icon name={playing ? 'pause' : 'play'} />
            )}
          </BarButton>
          <BarButton label="次の曲" disabled={index >= queue.length - 1} onClick={() => step(1)}>
            <Icon name="next" />
          </BarButton>
        </div>
        <Clock time={time} playing={playing} />

        {item ? (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <FadeImage
              key={item.videoId}
              src={thumbOf(item.videoId)}
              alt=""
              width={71}
              height={40}
              className="hidden aspect-video rounded sm:block"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{item.title}</p>
              <p className="truncate text-xs text-muted">
                {loading ? (
                  '読み込んでいます…'
                ) : (
                  <>
                    <Link href={`/artists/${item.artistId}`} className="hover:text-foreground">
                      {item.artistName}
                    </Link>
                    {' ・ '}
                    <Link href={`/albums/${item.albumId}`} className="hover:text-foreground">
                      {item.albumTitle}
                    </Link>
                  </>
                )}
              </p>
            </div>
            <HeartButton
              kind="songs"
              itemKey={songKeyOf(item)}
              label={item.title}
              className="size-9"
            />
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <BarButton label="プレイヤーを閉じる" onClick={close}>
          <Icon name="close" />
        </BarButton>
      </div>
    </div>
  );
}

/** 拾った時刻から、今の時刻を補う。再生中だけ進める */
function now(time: PlaybackTime, playing: boolean): number {
  const elapsed = playing ? (performance.now() - time.at) / 1000 : 0;
  return Math.min(time.current + elapsed, time.duration || Infinity);
}

/**
 * 再生位置の線。時刻は 0.5 秒おきにしか拾えないので、間は毎フレーム補って描く。
 * 描き直しは React を通さず、要素の幅を直接変える
 */
function Progress({
  time,
  playing,
  onSeek,
}: {
  time: PlaybackTime;
  playing: boolean;
  onSeek: (seconds: number) => void;
}) {
  const fill = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let id = 0;
    const draw = () => {
      const ratio = time.duration > 0 ? now(time, playing) / time.duration : 0;
      if (fill.current) fill.current.style.transform = `scaleX(${ratio})`;
      if (playing) id = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(id);
  }, [time, playing]);

  return (
    <button
      type="button"
      aria-label="再生位置"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onSeek(((e.clientX - r.left) / r.width) * time.duration);
      }}
      className="group absolute inset-x-0 -top-1.5 h-3 cursor-pointer"
    >
      <span className="absolute inset-x-0 top-1 h-0.5 bg-line transition-[height] group-hover:h-1" />
      <span
        ref={fill}
        className="absolute inset-x-0 top-1 h-0.5 origin-left scale-x-0 bg-accent transition-[height] group-hover:h-1"
      />
    </button>
  );
}

function Clock({ time, playing }: { time: PlaybackTime; playing: boolean }) {
  return (
    <span className="hidden w-24 text-xs tabular-nums text-muted lg:block">
      {clock(now(time, playing))} / {clock(time.duration)}
    </span>
  );
}

function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function BarButton({
  label,
  large,
  disabled,
  onClick,
  children,
}: {
  label: string;
  large?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid shrink-0 place-items-center rounded-full transition-[scale,color] duration-150 ease-out active:scale-90 disabled:opacity-30 ${
        large
          ? 'size-11 text-foreground disabled:opacity-100 [&_svg]:size-8'
          : 'size-10 text-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}
