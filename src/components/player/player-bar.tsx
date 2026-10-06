'use client';

import Image from 'next/image';
import Link from 'next/link';
import { thumbOf } from '@/lib/catalog';
import { Icon } from '../icon';
import { usePlayer } from './player-provider';

/** 画面の下に出したままにする操作の帯。曲を選ぶと出て、閉じるまで消えない */
export function PlayerBar() {
  const { queue, index, current, playing, toggle, step, close, seek, time } = usePlayer();
  if (!current) return null;
  const ratio = time.duration > 0 ? time.current / time.duration : 0;

  return (
    <div className="fixed inset-x-0 bottom-14 z-40 h-16 border-t border-line bg-bar md:bottom-0">
      {/* 進み具合。押した位置へ飛ぶ */}
      <button
        type="button"
        aria-label="再生位置"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          seek(((e.clientX - r.left) / r.width) * time.duration);
        }}
        className="group absolute inset-x-0 -top-1.5 h-3 cursor-pointer"
      >
        <span className="absolute inset-x-0 top-1 h-0.5 bg-line group-hover:h-1" />
        <span
          className="absolute top-1 left-0 h-0.5 bg-accent group-hover:h-1"
          style={{ width: `${ratio * 100}%` }}
        />
      </button>

      <div className="flex h-full items-center gap-3 px-3 sm:gap-4 sm:px-4">
        <div className="flex items-center sm:gap-1">
          <BarButton label="前の曲" disabled={index <= 0} onClick={() => step(-1)}>
            <Icon name="prev" />
          </BarButton>
          <BarButton label={playing ? '一時停止' : '再生'} large onClick={toggle}>
            <Icon name={playing ? 'pause' : 'play'} />
          </BarButton>
          <BarButton label="次の曲" disabled={index >= queue.length - 1} onClick={() => step(1)}>
            <Icon name="next" />
          </BarButton>
        </div>
        <span className="hidden w-24 text-xs tabular-nums text-muted lg:block">
          {clock(time.current)} / {clock(time.duration)}
        </span>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Image
            src={thumbOf(current.videoId)}
            alt=""
            width={71}
            height={40}
            className="hidden aspect-video rounded sm:block"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{current.title}</p>
            <p className="truncate text-xs text-muted">
              <Link href={`/artists/${current.artistId}`} className="hover:text-foreground">
                {current.artistName}
              </Link>
              {' ・ '}
              <Link href={`/albums/${current.albumId}`} className="hover:text-foreground">
                {current.albumTitle}
              </Link>
            </p>
          </div>
        </div>

        <BarButton label="プレイヤーを閉じる" onClick={close}>
          <Icon name="close" />
        </BarButton>
      </div>
    </div>
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
      className={`grid shrink-0 place-items-center rounded-full disabled:opacity-30 ${
        large
          ? 'size-11 text-foreground [&_svg]:size-8'
          : 'size-10 text-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}
