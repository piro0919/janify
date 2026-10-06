import Link from 'next/link';
import { FadeImage } from './fade-image';
import { NowPlaying } from './now-playing';

// YouTube のサムネイルは加工せずに出す（規約）。16:9 の mqdefault を 16:9 の枠に入れるので、端は切れない。
// 押すと詳しい画面へ移るだけで、ここでは再生しない
export function CoverCard({
  href,
  cover,
  title,
  sub,
  eager,
  playing,
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
  className?: string;
}) {
  return (
    <Link href={href} className={`group block ${className}`}>
      <div className="relative aspect-video overflow-hidden rounded-md bg-surface transition-[translate,box-shadow] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-black/40 group-active:translate-y-0">
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
  );
}

/** 棚の中の1枚。幅を固定し、送ったときに頭がそろうようにする */
export const SHELF_ITEM = 'w-44 shrink-0 snap-start sm:w-56';

/** 一覧の画面で、棚と同じカードを敷き詰める格子 */
export const COVER_GRID =
  'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
