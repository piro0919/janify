'use client';

import { type ReactNode, type RefObject, useEffect, useRef } from 'react';
import { Icon } from '../icon';

/**
 * 再生の帯のボタンから開く板（次に流れる曲・スリープタイマー・キーボード操作の一覧）の外枠。Vocafy から移した。
 * 置き場所と高さの上限は globals.css の .float-panel（下の帯の上。右下の窓で流しているときは窓の帯の上。動画に重ねない）。
 *
 * 置いたままにして、open で出し入れする（閉じるときも下へ少しずらしながら消す）。開いたら板にフォーカスを移し、
 * 閉じたら開いたボタンに戻す。見出しの × か、板の外を押すか、Esc で閉じる。板は portal で body の直下に出す
 */
export function FloatingPanel({
  open,
  onClose,
  trigger,
  title,
  onOpened,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** 開いたボタン。閉じたらここにフォーカスを戻す（キーで開いたときは、開く前にフォーカスのあった所） */
  trigger: RefObject<HTMLElement | null>;
  /** 板の見出し。読み上げの名前と、閉じるボタンの名前（「◯◯を閉じる」）にも使う */
  title: string;
  /** 開いたときに中身を整える（次に流れる曲は、並びの先頭までスクロールを戻す） */
  onOpened?: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // 板の外を押したら閉じる。押した先の操作（曲を押す・画面を移るなど）はそのまま効かせる。
    // 開いたボタンを押したときは、ボタンの側で閉じる（ここでも閉じると、閉じてすぐ開き直す）。
    // 動画（YouTube の埋め込み）の中を押したときは、知らせが届かないので閉じない
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panel.current?.contains(target) || trigger.current?.contains(target)) return;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    onOpened?.();
    // 開いたら板にフォーカスを移す（描き終えてから）
    const frame = requestAnimationFrame(() => panel.current?.focus({ preventScroll: true }));
    const button = trigger.current;
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
      cancelAnimationFrame(frame);
      button?.focus({ preventScroll: true });
    };
  }, [open, onClose, trigger, onOpened]);

  return (
    <div
      ref={panel}
      role="dialog"
      aria-label={title}
      aria-hidden={!open}
      inert={!open}
      tabIndex={-1}
      className={`chrome-bottom float-panel fixed z-40 flex flex-col overflow-hidden rounded-lg border border-line/60 bg-sidebar/80 shadow-2xl shadow-black/20 outline-none backdrop-blur-lg backdrop-saturate-150 transition-[opacity,translate,visibility] duration-300 ease-(--ease-out) motion-reduce:transition-none dark:shadow-black/60 ${
        // 見える・見えないの切り替え（visibility）は閉じるときだけ動きに乗せ、消えきってから見えなくする。
        // 開くときにも乗せると、出し始めはまだ見えない扱いで、フォーカスを受け付けない
        open ? '' : 'invisible translate-y-4 opacity-0'
      }`}
    >
      {/* 閉じる × は、右下の窓の帯の × と同じ形にそろえる */}
      <div className="flex items-center pt-1.5 pb-0.5 pl-4">
        <h2 className="min-w-0 flex-1 font-bold">{title}</h2>
        <button
          type="button"
          aria-label={`${title}を閉じる`}
          onClick={onClose}
          className="grid size-9 shrink-0 place-items-center text-muted transition-[color,scale] duration-150 ease-out hover:text-foreground active:scale-90"
        >
          <Icon name="close" className="size-4" />
        </button>
      </div>
      {children}
    </div>
  );
}
