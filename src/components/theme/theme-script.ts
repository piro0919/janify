import { DOCK_SIDE_KEY } from '../player/dock-side';

/**
 * ページを描く前に <html data-theme>（と右下の窓を寄せる側の data-dock）を付けるスクリプト。layout.tsx の <head> にそのまま埋め込む。
 * React が動き出してから色を決めると、開いた瞬間に暗い画面から明るい画面へちらつくため。
 * 選んだテーマは localStorage の THEME_KEY。'light' | 'dark' で、無ければ端末の設定に合わせる
 */
export const THEME_KEY = 'janify-theme';

export const themeScript = `(() => {
  try {
    const pref = localStorage.getItem('${THEME_KEY}');
    const dark = pref ? pref === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    // 右下の窓を左に寄せる設定（dock-side.ts）。開いた瞬間に右から左へ飛ばないよう、描く前に付ける
    if (localStorage.getItem('${DOCK_SIDE_KEY}') === 'left') document.documentElement.dataset.dock = 'left';
  } catch {}
})();`;
