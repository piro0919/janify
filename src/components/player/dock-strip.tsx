'use client';

import Link from 'next/link';
import { type PointerEvent as ReactPointerEvent, useRef } from 'react';
import type { QueueItem } from '@/lib/catalog';
import { EASE_OUT, prefersReducedMotion } from '@/lib/motion';
import { Icon } from '../icon';
import { type DockSide, saveDockSide } from './dock-side';
import { resetDockSize, startDockResize, useDockSize } from './dock-size';

/** 指がこれだけ動いたら、押したのではなく引いたとみなす（px） */
const DRAG_SLOP = 8;
/** 離したとき、これだけ引いていれば、引いた向きの側へ寄せる（px） */
const DRAG_SWITCH = 48;
/** 寄せた先まで滑らせる長さ（ミリ秒） */
const SLIDE_MS = 300;
/** 出入りの動き。閉じたあとは少し下へずらして消す */
export const FADE = 'transition-[opacity,translate,visibility] duration-300 ease-(--ease-out)';
export const HIDDEN = 'pointer-events-none invisible translate-y-4 opacity-0';

/**
 * 右下の窓の上に付ける帯。押すと曲の入ったアルバムの画面（お気に入りの並びなら、お気に入りの曲の画面）に移り、そこで大きく出る。
 * 窓の中は YouTube のプレイヤーで、押すと YouTube 側の操作になるので、入口は窓の外に置く。× で再生ごと止める。
 * 帯を横に引くと窓を左右に寄せられ、パソコンでは外側の角の引き手で窓を大きくできる（Vocafy から移した）
 */
export function DockStrip({
  shown,
  open,
  favorites,
  onClose,
}: {
  /** 帯に出す曲。閉じたあとも、帯が消えきるまでは最後の曲 */
  shown: QueueItem | null;
  open: boolean;
  /** お気に入りの並びで流しているか（帯の行き先がお気に入りの曲の画面になる） */
  favorites: boolean;
  onClose: () => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  // 引いたあとの「押した」を、帯の行き先へのリンクに渡さない
  const dragged = useRef(false);
  useDockSize();

  /**
   * 帯を横に引いて、窓を左右に寄せる。右手で持つスマホでは右下の窓が親指の通り道にあるため。
   * 動画の中は埋め込みが指の操作を取るので、つかめるのは帯だけ。引いているあいだは窓と帯を指に付いて動かし、
   * 離したら引いた向きの側へ寄せる。寄せる側は設定の画面（dock-setting.tsx）でも選べる
   */
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as Element).closest('button, [data-dock-arc]')) return;
    const el = strip.current;
    // 動画の枠と、開き直して戻した曲の再生ボタン（動画の枠の代わりに窓の場所に出す）
    const boxes = [
      ...document.querySelectorAll<HTMLElement>('[data-player-frame], [data-dock-cover]'),
    ];
    if (!el) return;
    const pointerId = e.pointerId;
    const startX = e.clientX;
    let dx = 0;
    let moving = false;
    dragged.current = false;

    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      dx = ev.clientX - startX;
      if (!moving) {
        if (Math.abs(dx) < DRAG_SLOP) return;
        moving = true;
        dragged.current = true;
        el.setPointerCapture(pointerId);
        // 指が動画の上に入っても、埋め込みに取られないようにする
        for (const box of boxes) box.style.pointerEvents = 'none';
      }
      for (const node of [el, ...boxes]) node.style.transform = `translateX(${dx}px)`;
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (!moving) return;
      const current: DockSide = document.documentElement.dataset.dock === 'left' ? 'left' : 'right';
      const side: DockSide = dx <= -DRAG_SWITCH ? 'left' : dx >= DRAG_SWITCH ? 'right' : current;
      // 指を離した位置から、寄せた先まで滑らせる（FLIP）
      const before = el.getBoundingClientRect().left;
      for (const node of [el, ...boxes]) {
        node.style.transform = '';
        node.style.pointerEvents = '';
      }
      saveDockSide(side);
      const offset = before - el.getBoundingClientRect().left;
      if (offset !== 0 && !prefersReducedMotion()) {
        for (const node of [el, ...boxes]) {
          node.animate([{ transform: `translateX(${offset}px)` }, { transform: 'none' }], {
            duration: SLIDE_MS,
            easing: EASE_OUT,
          });
        }
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  return (
    <div
      ref={strip}
      // スワイプで戻る（swipe-back.tsx）が、帯を引く操作を取らないための目印
      data-dock-strip
      aria-hidden={!open}
      inert={!open}
      onPointerDown={onPointerDown}
      onClickCapture={(e) => {
        if (!dragged.current) return;
        dragged.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
      className={`chrome-bottom dock-strip fixed ${FADE} z-30 flex touch-pan-y items-center rounded-t-lg bg-sidebar/60 backdrop-blur-lg backdrop-saturate-150 select-none ${open ? '' : HIDDEN}`}
    >
      {/*
        窓の大きさを変える引き手（パソコンだけ。dock-size.ts）。窓は画面の端の側の角が動かないので、反対の外側の角に置く。
        右に寄せているときは左上、左に寄せているときは右上。角の丸みに沿った弧（globals.css の data-dock-arc）
      */}
      <span
        aria-hidden
        title="大きさを変える"
        data-dock-arc="left"
        onPointerDown={startDockResize}
        onDoubleClick={resetDockSize}
        className="z-10 hidden cursor-nwse-resize text-muted md:block md:[html[data-dock=left]_&]:hidden"
      />
      <span
        aria-hidden
        title="大きさを変える"
        data-dock-arc="right"
        onPointerDown={startDockResize}
        onDoubleClick={resetDockSize}
        className="z-10 hidden cursor-nesw-resize text-muted md:[html[data-dock=left]_&]:block"
      />
      {shown && (
        <Link
          draggable={false}
          // お気に入りの並びで流しているときは、お気に入りの曲の画面で大きく出す（アルバムの画面では大きく出ない）
          href={favorites ? '/library/songs' : `/albums/${shown.albumId}`}
          className="flex h-full min-w-0 flex-1 items-center gap-2 pl-3 text-xs text-muted transition-colors hover:text-foreground"
        >
          <span className="min-w-0 flex-1 truncate">
            <span className="font-bold text-foreground">{shown.title}</span>
            {' ・ '}
            {shown.albumTitle}
          </span>
          <Icon name="expand" className="size-4 shrink-0" />
        </Link>
      )}
      {/* 窓だけ消して音を流し続けることはできない（プレイヤーは見えている必要がある）ので、下の帯の × と同じく再生ごと止める */}
      <button
        type="button"
        aria-label="プレイヤーを閉じる"
        onClick={onClose}
        className="grid h-full w-9 shrink-0 place-items-center text-muted transition-[color,scale] duration-150 ease-out hover:text-foreground active:scale-90"
      >
        <Icon name="close" className="size-4" />
      </button>
    </div>
  );
}
