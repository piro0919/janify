import Image from 'next/image';
import Link from 'next/link';

// YouTube のサムネイルは加工せずに出す（規約）。16:9 の mqdefault を 16:9 の枠に入れるので、端は切れない。
// 押すと詳しい画面へ移るだけで、ここでは再生しない
export function CoverCard({
  href,
  cover,
  title,
  sub,
  eager,
  className = '',
}: {
  href: string;
  cover: string | null;
  title: string;
  sub?: string;
  /** 最初の行は画面に入った時点で見えるので、遅延読み込みにしない */
  eager?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={`group block ${className}`}>
      <div className="relative aspect-video overflow-hidden rounded-md bg-surface">
        {cover && (
          <Image
            src={cover}
            alt=""
            fill
            loading={eager ? 'eager' : 'lazy'}
            sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-opacity group-hover:opacity-80"
          />
        )}
      </div>
      <p className="mt-2 truncate text-sm font-bold">{title}</p>
      {sub && <p className="truncate text-xs text-muted">{sub}</p>}
    </Link>
  );
}

/** 棚の中の1枚。幅を固定し、送ったときに頭がそろうようにする */
export const SHELF_ITEM = 'w-44 shrink-0 snap-start sm:w-56';

/** 一覧の画面で、棚と同じカードを敷き詰める格子 */
export const COVER_GRID =
  'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
