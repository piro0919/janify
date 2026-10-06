'use client';

import { useEffect, useRef } from 'react';
import { FadeImage } from './fade-image';
import { Icon } from './icon';
import { usePlayer } from './player/player-provider';

/**
 * 詳細画面（アルバム・お気に入りの曲）の大きなプレイヤーの置き場所。
 * この画面の並びで流している間（active）は、共通のプレイヤーがここに重なって大きく出る（player-provider.tsx が位置を合わせる）。
 * そうでないときは、サムネイルと再生ボタンを出す。サムネイルの上に重ねてよいのは再生ボタンだけ（YouTube の規約）。
 * スマホではこの置き場所だけを、ヘッダーのすぐ下に貼り付ける
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
  const slot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    setSlot(slot.current);
    return () => setSlot(null);
  }, [active, setSlot]);

  if (active) {
    return (
      <div
        ref={slot}
        className="aspect-video w-full rounded-lg bg-black max-lg:sticky max-lg:top-16 max-lg:z-10"
      />
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
