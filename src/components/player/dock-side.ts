/**
 * 右下の窓（ミニプレーヤー）を寄せる側（Vocafy から移した）。右手で持つスマホでは、右の窓がスクロールする親指の通り道に
 * 重なるため、左にも寄せられる。設定の画面（dock-setting.tsx）か、窓の上の帯を横に引いて変える（player-provider.tsx）。
 * html の data-dock で持ち、窓・帯・板は globals.css でそれを見て並ぶ。開いた瞬間の位置は theme-script.ts が描く前に付ける
 */
export const DOCK_SIDE_KEY = 'janify-dock-side';
const CHANGE_EVENT = 'janify-dock-side-change';

export type DockSide = 'left' | 'right';

export function savedDockSide(): DockSide {
  try {
    return localStorage.getItem(DOCK_SIDE_KEY) === 'left' ? 'left' : 'right';
  } catch {
    return 'right';
  }
}

/** 寄せる側を残し、html の data-dock を書き換える */
export function saveDockSide(side: DockSide) {
  try {
    if (side === 'left') localStorage.setItem(DOCK_SIDE_KEY, 'left');
    else localStorage.removeItem(DOCK_SIDE_KEY);
  } catch {
    // 保存できない窓では、開き直すと右に戻る
  }
  document.documentElement.dataset.dock = side;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** useSyncExternalStore 用 */
export function subscribeDockSide(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}
