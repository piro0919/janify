import Link from 'next/link';
import type { QueueItem } from '@/lib/catalog';
import { AlbumPlayButton } from './album-play-button';
import { FadeImage } from './fade-image';
import { NowPlaying } from './now-playing';

// YouTube のサムネイルは加工せずに出す（規約）。16:9 の mqdefault を 16:9 の枠に入れるので、端は切れない。
// 押すと詳しい画面へ移る。アルバムのカードには、マウスを載せると右下に再生ボタンが出て、押すとアルバムの画面で1曲目から流す
export function CoverCard({
  href,
  cover,
  title,
  sub,
  eager,
  playing,
  play,
  className = '',
}: {
  href: string;
  cover: string | null;
  title: string;
  sub?: string;
  /** 最初の行は画面に入った時点で見えるので、遅延読み込みにしない */
  eager?: boolean;
  /** いま流している曲がこのアルバム・アーティストのものなら、題名の横に印を出す */
  playing?: { albumId?: string; artistId?: string };
  /** アルバムの1曲目。渡すと、マウスを載せたときにサムネイルの右下へ再生ボタンを出す */
  play?: QueueItem;
  className?: string;
}) {
  return (
    // 再生ボタンはリンクの中に入れられない（a の中に button は置けない）ので、リンクの外に重ねる
    <div
      // マウスを載せたら、人気曲の行と同じく、サムネイルと題名を含むカード全体の地を変える。
      // 地の余白（p-2）の分だけ外へ広げ（-m-2）、並びの位置は変えない
      className={`group relative -m-2 rounded-lg p-2 transition-colors duration-150 hover:bg-foreground/8 ${className}`}
    >
      <Link href={href} className="block">
        <div className="relative aspect-video overflow-hidden rounded-md bg-surface">
          {cover && (
            <FadeImage
              src={cover}
              alt=""
              fill
              loading={eager ? 'eager' : 'lazy'}
              sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
              className="object-cover"
            />
          )}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-sm font-bold">
          <span className="truncate">{title}</span>
          {playing && <NowPlaying {...playing} />}
        </p>
        {sub && <p className="truncate text-xs text-muted">{sub}</p>}
      </Link>
      {play && (
        <div className="pointer-events-none absolute inset-x-2 top-2 aspect-video">
          <div className="pointer-events-auto absolute right-2 bottom-2">
            <AlbumPlayButton first={play} title={title} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 棚の中の1枚。幅を固定し、送ったときに頭がそろうようにする。
 * カードは地の余白（左右 0.5rem ずつ）を含むので、サムネイルの幅は 11rem / 14rem になる
 */
export const SHELF_ITEM = 'w-48 shrink-0 snap-start sm:w-60';

/** 一覧の画面で、棚と同じカードを敷き詰める格子 */
export const COVER_GRID =
  'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
