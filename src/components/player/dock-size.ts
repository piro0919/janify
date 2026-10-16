import { type PointerEvent as ReactPointerEvent, useEffect } from 'react';

/**
 * パソコンの右下の窓（ミニプレーヤー）の大きさ（Vocafy から移した）。窓の上の帯の外側の角の引き手を引いて変える
 * （player-provider.tsx の DockResizeHandle）。設定の画面には置かない。引き手が見えるので、引けることは見て分かる。
 * 縦横は 16:9 のまま、幅だけを持つ。下限はいまの大きさ（356×200。高さ 200px は YouTube の規約の下限）、上限は画面の幅の 75% と、
 * 窓と上の帯がヘッダーの下に収まる高さ。幅は html の --dock-size に書き、globals.css が窓・帯・板・本文の余白をそこから組み立てる。
 * スマホは正方形の下限のままで、動かせる幅が無いので変えない。決めた幅はこのブラウザに残す。引き手をダブルクリックすると元に戻す
 */
const KEY = 'janify-dock-width';
/** 下限の幅（px）。globals.css の --dock-w の既定と同じ */
const MIN_WIDTH = 356;
const RATIO = 16 / 9;
/** 上限。画面の幅に対する割合。大きくして本文や板が見えづらくなるのは、その人が選んだ結果として許す（Vocafy で本人と決めた） */
const MAX_SHARE = 0.75;
const WIDE = '(min-width: 48rem)';
/** 窓の下端（globals.css の --dock-bottom。4rem + 16px）と、上の帯の高さ（--dock-strip。2.25rem） */
const DOCK_BOTTOM = 80;
const STRIP = 36;

function saved(): number | null {
  try {
    const width = Number(localStorage.getItem(KEY));
    return Number.isFinite(width) && width > 0 ? width : null;
  } catch {
    return null;
  }
}

/**
 * 幅の上限。窓と上の帯が、ヘッダーの下に収まるところまで。ヘッダーに重なると、検索欄が窓の下に隠れて押せなくなる。
 * 測るたびに画面の配置を計算し直させるので、引いているあいだは引き始めに1回だけ測る
 */
function maxWidth(): number {
  const header = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
  const height = window.innerHeight - DOCK_BOTTOM - STRIP - header;
  return Math.min(window.innerWidth * MAX_SHARE, height * RATIO);
}

function clamp(width: number, max = maxWidth()): number {
  return Math.max(MIN_WIDTH, Math.min(width, max));
}

/** 窓の幅を html に書く。null や下限のときは、globals.css の元の大きさに戻す */
function apply(width: number | null) {
  const style = document.documentElement.style;
  if (width === null || !window.matchMedia(WIDE).matches || width <= MIN_WIDTH) {
    style.removeProperty('--dock-size');
    return;
  }
  style.setProperty('--dock-size', `${width}px`);
}

/** 残した大きさを当てる。画面の幅や高さが変わったら、上限に収め直す */
export function useDockSize() {
  useEffect(() => {
    const wide = window.matchMedia(WIDE);
    const refit = () => {
      const width = saved();
      apply(width === null ? null : clamp(width));
    };
    // 画面の大きさを変えているあいだは resize が続けて届くので、1コマに1回だけ収め直す
    let frame = 0;
    const onResize = () => {
      frame ||= requestAnimationFrame(() => {
        frame = 0;
        refit();
      });
    };
    refit();
    wide.addEventListener('change', refit);
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      wide.removeEventListener('change', refit);
      window.removeEventListener('resize', onResize);
    };
  }, []);
}

/**
 * 引き手を押したとき。外側の角を引いた分だけ窓を大きくする。右に寄せているときは左上の角を左か上へ、
 * 左に寄せているときは右上の角を右か上へ引くと大きくなり、逆へ引くと小さくなる。横と縦のうち、大きく動かした方に合わせる
 */
export function startDockResize(e: ReactPointerEvent<HTMLElement>) {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  const handle = e.currentTarget;
  const frame = document.querySelector<HTMLElement>('[data-player-frame]');
  const left = document.documentElement.dataset.dock === 'left';
  const startX = e.clientX;
  const startY = e.clientY;
  const startWidth = frame?.getBoundingClientRect().width ?? MIN_WIDTH;
  let width = startWidth;
  // 引いているあいだは画面の大きさが変わらないので、上限は引き始めに1回だけ測る
  const max = maxWidth();
  handle.setPointerCapture(e.pointerId);
  // 引いているあいだに指が動画の上へ入っても、埋め込みに取られないようにする
  if (frame) frame.style.pointerEvents = 'none';

  const move = (ev: PointerEvent) => {
    const dx = left ? ev.clientX - startX : startX - ev.clientX;
    const dy = (startY - ev.clientY) * RATIO;
    width = clamp(startWidth + (Math.abs(dx) >= Math.abs(dy) ? dx : dy), max);
    apply(width);
  };
  const up = () => {
    handle.removeEventListener('pointermove', move);
    handle.removeEventListener('pointerup', up);
    handle.removeEventListener('pointercancel', up);
    if (frame) frame.style.pointerEvents = '';
    try {
      if (width <= MIN_WIDTH) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, String(Math.round(width)));
    } catch {
      // 残せない窓では、開き直すと元の大きさに戻る
    }
  };
  handle.addEventListener('pointermove', move);
  handle.addEventListener('pointerup', up);
  handle.addEventListener('pointercancel', up);
}

/** 元の大きさに戻す（引き手のダブルクリック） */
export function resetDockSize() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 残せない窓でも、この画面では戻る
  }
  apply(null);
}
