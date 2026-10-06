'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Icon } from './icon';

/** 見出しの付いた、横に流せる棚。左右の矢印で1画面ぶん送る */
export function Shelf({
  title,
  href,
  children,
}: {
  title: string;
  /** 「すべて表示」の行き先 */
  href?: string;
  children: ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = () => {
    const el = track.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 1,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
    });
  };
  useEffect(update, []);

  const page = (dir: 1 | -1) =>
    track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.9, behavior: 'smooth' });

  return (
    <section className="mt-10 first:mt-4">
      <div className="mb-4 flex items-end gap-3">
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        <div className="ml-auto flex items-center gap-2">
          {href && (
            <Link
              href={href}
              className="rounded-full border border-line px-3 py-1 text-xs font-bold text-muted hover:bg-surface hover:text-foreground"
            >
              すべて表示
            </Link>
          )}
          <ArrowButton label="前へ" disabled={edge.start} onClick={() => page(-1)}>
            <Icon name="left" className="size-5" />
          </ArrowButton>
          <ArrowButton label="次へ" disabled={edge.end} onClick={() => page(1)}>
            <Icon name="right" className="size-5" />
          </ArrowButton>
        </div>
      </div>
      <div
        ref={track}
        onScroll={update}
        className="-mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </section>
  );
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="hidden size-8 place-items-center rounded-full border border-line text-foreground transition-[background-color,scale] duration-150 ease-out hover:bg-surface active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent sm:grid"
    >
      {children}
    </button>
  );
}
