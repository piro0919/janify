'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Icon } from './icon';
import { Logo } from './nav';
import { SearchBox } from './search-box';

const ICON_BUTTON =
  'grid size-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-foreground';

/**
 * 上の帯の中身。
 * パソコンは検索欄を常に出す（ロゴは左のメニューにある）。
 * スマホは幅が足りないので、アイコン・虫めがね・歯車だけを並べ、虫めがねを押すと検索欄が帯いっぱいに広がる
 * （YouTube Music と同じ）。検索の画面にいるあいだは、最初から広げておく
 */
export function HeaderBar() {
  const pathname = usePathname();
  const router = useRouter();
  const onSearch = pathname === '/search';
  const [open, setOpen] = useState(false);

  // 検索の画面から離れたら、広げた検索欄を畳む
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (!onSearch) setOpen(false);
  }
  const expanded = open || onSearch;

  return (
    <>
      <div className="hidden w-full md:block">
        {/* 検索欄は URL の語を読むので、静的に書き出す画面では Suspense で包む */}
        <Suspense fallback={<div className="h-10 w-full max-w-xl" />}>
          <SearchBox />
        </Suspense>
      </div>

      {expanded ? (
        <div className="flex w-full items-center gap-1 md:hidden">
          <button
            type="button"
            aria-label="検索を閉じる"
            onClick={() => {
              setOpen(false);
              // 検索の画面からは前の画面へ戻る。いきなり検索の画面に来たときは、トップへ
              if (onSearch) {
                if (window.history.length > 1) router.back();
                else router.push('/');
              }
            }}
            className={ICON_BUTTON}
          >
            <Icon name="left" />
          </button>
          <Suspense fallback={<div className="h-10 w-full" />}>
            <SearchBox autoFocus={!onSearch} />
          </Suspense>
        </div>
      ) : (
        <div className="flex w-full items-center gap-1 md:hidden">
          <Logo compact />
          <span className="flex-1" />
          <button
            type="button"
            aria-label="検索"
            onClick={() => setOpen(true)}
            className={ICON_BUTTON}
          >
            <Icon name="search" />
          </button>
          {/* スマホは左のメニューが出ないので、設定への入口を上の帯の右端に置く（YouTube Music のアプリと同じ） */}
          <Link href="/settings" aria-label="設定" className={ICON_BUTTON}>
            <Icon name="settings" className="size-5" />
          </Link>
        </div>
      )}
    </>
  );
}
