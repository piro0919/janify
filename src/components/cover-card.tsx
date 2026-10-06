import Image from 'next/image';
import Link from 'next/link';

// YouTube のサムネイルは加工せずに出す（規約）。押すと詳しい画面へ移るだけで、ここでは再生しない
export function CoverCard({
  href,
  cover,
  title,
  sub,
  eager,
}: {
  href: string;
  cover: string | null;
  title: string;
  sub?: string;
  /** 最初の行は画面に入った時点で見えるので、遅延読み込みにしない */
  eager?: boolean;
}) {
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-surface">
        {cover && (
          <Image
            src={cover}
            alt=""
            fill
            loading={eager ? 'eager' : 'lazy'}
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-opacity group-hover:opacity-80"
          />
        )}
      </div>
      <p className="mt-2 truncate font-bold">{title}</p>
      {sub && <p className="truncate text-sm text-muted">{sub}</p>}
    </Link>
  );
}
