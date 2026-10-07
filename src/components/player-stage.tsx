'use client';

import { useRouter } from 'next/navigation';
import { useLayoutEffect, useRef } from 'react';
import { FadeImage } from './fade-image';
import { Icon } from './icon';
import { usePlayer } from './player/player-provider';

/**
 * 詳細画面（アルバム・お気に入りの曲）の大きなプレイヤーの置き場所。
 * この画面の並びで流している間（active）は、共通のプレイヤーがここに重なって大きく出る（player-provider.tsx が位置を合わせる）。
 * そうでないときは、サムネイルと再生ボタンを出す。サムネイルの上に重ねてよいのは再生ボタンだけ（YouTube の規約）。
 * パソコンでは列ごと上に貼り付く（album-player.tsx）。
 *
 * スマホで流している間は、YouTube のアプリの動画の画面と同じ形にする。動画を画面の上に固定し、ヘッダーと
 * 下のタブを隠して、曲目を見る場所を取り戻す（一時停止しても戻さない）。動画のすぐ下の帯の矢印を押すか、
 * 帯を下へ引くと、前の画面に戻り、動画は右下の窓に縮む。動画そのものを引く形は作れない。
 * 動画の上の指の動きは YouTube の埋め込みの中に届いてこちらには来ず、上に透明な層を重ねて拾うのは規約に触れる
 */
export function PlayerStage({
  active,
  cover,
  label,
  onPlay,
}: {
  active: boolean;
  cover: string | null;
  /** 再生ボタンの読み上げ。「このアルバムを再生」など */
  label: string;
  onPlay: () => void;
}) {
  const { setSlot } = usePlayer();
  const router = useRouter();
  const slot = useRef<HTMLDivElement>(null);

  // 画面を描く前に置き場所を知らせる。描いたあとだと、最初の1曲を流し始めた瞬間に、
  // プレイヤーが一度だけ右下の窓として描かれてしまう
  useLayoutEffect(() => {
    if (!active) return;
    setSlot(slot.current);
    // スマホでヘッダーと下のタブを隠す印（globals.css）
    document.documentElement.dataset.watch = '';
    return () => {
      setSlot(null);
      delete document.documentElement.dataset.watch;
    };
  }, [active, setSlot]);

  /** 前の画面に戻る。置き場所が無くなるので、プレイヤーは右下の窓に縮む。いきなりこの画面に来たときは、トップへ */
  const collapse = () => {
    if (window.history.length > 1) router.back();
    else router.push('/');
  };

  if (active) {
    return (
      <>
        {/* スマホで固定したぶん、本文が動画の下に潜らないよう、同じ高さの空きを置く */}
        <div aria-hidden className="md:hidden">
          <div className="aspect-video" />
          <div className="h-11" />
        </div>
        <div className="max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:z-40 max-md:bg-background">
          <div ref={slot} className="aspect-video w-full bg-black md:rounded-lg" />
          {/* 動画の外の、こちらの部品なので指の動きを拾える。引いているあいだ、ページはスクロールさせない */}
          <div
            className="flex h-11 touch-none items-center px-1 md:hidden"
            // 指は帯の外まで動くので、離したことは画面全体で受け取る。帯で指を捕まえると矢印のボタンが押せなくなる
            onPointerDown={(e) => {
              const from = e.clientY;
              const up = (end: PointerEvent) => {
                window.removeEventListener('pointerup', up);
                window.removeEventListener('pointercancel', cancel);
                if (end.clientY - from > 40) collapse();
              };
              const cancel = () => {
                window.removeEventListener('pointerup', up);
                window.removeEventListener('pointercancel', cancel);
              };
              window.addEventListener('pointerup', up);
              window.addEventListener('pointercancel', cancel);
            }}
          >
            <button
              type="button"
              aria-label="プレイヤーを縮める"
              onClick={collapse}
              className="grid size-10 place-items-center rounded-full text-muted transition-[color,scale] duration-150 ease-out hover:text-foreground active:scale-90"
            >
              <Icon name="down" className="size-6" />
            </button>
            {/* 引けることを伝えるつまみ */}
            <span aria-hidden className="mx-auto h-1 w-10 rounded-full bg-muted/40" />
            <span className="size-10" />
          </div>
        </div>
      </>
    );
  }
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={label}
      className="group relative block aspect-video w-full overflow-hidden rounded-lg bg-surface"
    >
      {cover && (
        <FadeImage
          src={cover}
          alt=""
          fill
          loading="eager"
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
        />
      )}
      <span className="absolute top-1/2 left-1/2 grid size-16 -translate-1/2 place-items-center rounded-full bg-accent text-background shadow-lg transition-[scale] duration-200 ease-out group-hover:scale-105 group-active:scale-95">
        <Icon name="play" className="size-9" />
      </span>
    </button>
  );
}
