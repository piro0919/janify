import type { useRouter } from 'next/navigation';

/**
 * サイトの中で進んだ画面の数（ブラウザのタブに1つ）。書き換えるのは NavigationDepth だけ。
 * 0 のときに「戻る」を押すと、ブラウザの履歴に残っているサイトの外のページへ戻ってしまう
 * （共有のリンクを同じタブで開いた人なら X など。Vocafy で確かめた）
 */
let depth = 0;

/**
 * 住所が変わった。ブラウザの「戻る」「進む」で変わったとき（popped）は1つ戻し、それ以外は1つ進める。
 * 「進む」と「戻る」は見分けられないので、「進む」でも戻す（そのときは戻る操作がトップへ移る側に倒れ、サイトの外には出ない）
 */
export function arrived(popped: boolean) {
  depth = Math.max(0, depth + (popped ? -1 : 1));
}

/** Navigation API（Chromium・Safari 26 から）の分だけの形。TypeScript の型に、まだ入っていない */
type NavigationApi = {
  canGoBack: boolean;
  currentEntry?: { index: number } | null;
  entries?: () => { sameDocument: boolean }[];
};

/**
 * 「戻る」で、ページを読み込み直さずに前の画面へ移れるか。canGoBack は同じサイトの別のページ読み込みの履歴も数えるので、
 * 一つ前の項目が同じページ読み込みの中にあるかを見る。別のページ読み込みへ戻ると、ページごと読み込み直されて
 * 流している曲が止まる（Vocafy で、Android の Chrome で確かめた）
 */
function backStaysInPage(api: NavigationApi): boolean {
  if (!api.canGoBack) return false;
  const index = api.currentEntry?.index;
  const entries = api.entries?.();
  if (index === undefined || !entries) return true;
  return entries[index - 1]?.sameDocument ?? false;
}

/** 戻る先が無く履歴が動かなかったとみなすまでの時間（ミリ秒） */
const BACK_FALLBACK = 500;

/**
 * 前の画面に戻る。サイトの中で戻る先が無いとき（共有のリンクなどからいきなりこの画面に来たとき）は、トップへ。
 *
 * 戻る先があるかは、ブラウザが Navigation API を持っていれば canGoBack で決める。canGoBack は同じサイトの履歴だけを
 * 数えるので、共有のリンクから来た人では false になり、サイトの外へは戻らない。持たないブラウザ（2026-10 の Firefox など）は、
 * サイトの中で進んだ数と、「戻る」を送って履歴が動かなければトップへ移る保険で決める
 */
export function leave(router: ReturnType<typeof useRouter>) {
  const api = (window as { navigation?: NavigationApi }).navigation;
  if (api && typeof api.canGoBack === 'boolean') {
    if (backStaysInPage(api)) router.back();
    else router.push('/');
    return;
  }
  if (depth === 0) {
    router.push('/');
    return;
  }
  let moved = false;
  const onPop = () => {
    moved = true;
  };
  window.addEventListener('popstate', onPop, { once: true });
  router.back();
  setTimeout(() => {
    window.removeEventListener('popstate', onPop);
    if (!moved) router.push('/');
  }, BACK_FALLBACK);
}
