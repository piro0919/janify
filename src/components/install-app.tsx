'use client';

import dynamic from 'next/dynamic';
import { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { usePwa } from 'use-pwa';

const PWAPrompt = dynamic(() => import('react-ios-pwa-prompt'), { ssr: false });

/** iOS / iPadOS か。iPad の Safari は Mac を名乗るので、触れる Mac は iPad とみなす */
function isAppleDevice(): boolean {
  const agent = window.navigator.userAgent.toLowerCase();
  return (
    /iphone|ipad|ipod/.test(agent) ||
    (agent.includes('macintosh') && window.navigator.maxTouchPoints > 1)
  );
}

/**
 * 設定の画面の「ホーム画面に追加」（koidamashii・spatto と同じ形）。
 * Chrome 系はブラウザの確認を出す。iOS は API が無いので、共有ボタンから追加する手順を案内する。
 * 入れたあとと、どちらもできない端末では、その旨だけを出す。
 * 裏に回すと再生が止まるのは、ホーム画面から開いても変わらない（YouTube の埋め込みの決まり）
 */
export function InstallApp() {
  const { canInstall, install, isInstalled } = usePwa();
  const [guide, setGuide] = useState(false);
  // 端末の判定は window を見る。サーバー側では決まらないので、載ってから読む
  const isApple = useSyncExternalStore(
    () => () => {},
    isAppleDevice,
    () => false,
  );

  return (
    <section className="mt-10">
      <h2 className="mb-3 font-bold">アプリ</h2>
      {isInstalled ? (
        <p className="px-3 text-sm text-muted">ホーム画面に追加済みです。</p>
      ) : canInstall || isApple ? (
        <button
          type="button"
          onClick={() => (canInstall ? void install() : setGuide(true))}
          className="rounded-full border border-line px-4 py-2 text-sm font-bold transition-[background-color,scale] duration-150 ease-out hover:bg-surface active:scale-95"
        >
          ホーム画面に追加
        </button>
      ) : (
        <p className="px-3 text-sm text-muted">このブラウザでは、ホーム画面に追加できません。</p>
      )}
      {isApple && !canInstall
        ? createPortal(
            <PWAPrompt
              isShown={guide}
              onClose={() => setGuide(false)}
              appIconPath="/apple-icon.png"
              copyTitle="ホーム画面に追加"
              copyDescription="ホーム画面から Janify をすばやく開けます。"
              copyShareStep="共有ボタンをタップ"
              copyAddToHomeScreenStep="「ホーム画面に追加」をタップ"
              delay={100}
            />,
            document.body,
          )
        : null}
    </section>
  );
}
