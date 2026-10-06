'use client';

import { useRouter } from 'next/navigation';
import type { QueueItem } from '@/lib/catalog';
import { Icon } from './icon';
import { usePlayer } from './player/player-provider';

/**
 * アルバムのカードのサムネイルの右下に、マウスを載せると出る再生ボタン（YouTube Music・Amazon Music と同じ）。
 * サムネイルの上に重ねてよいのは再生ボタンだけで、押したら再生が始まる必要がある（YouTube の規約）。
 * 押すとアルバムの画面へ移り、1曲目から流す。曲の一覧から曲を押したときと同じく、iPhone のために
 * 押した瞬間にまず1曲目を流し、順番待ちはアルバムの画面に着いてから曲目に差し替える（album-player.tsx）
 */
export function AlbumPlayButton({ first, title }: { first: QueueItem; title: string }) {
  const { playQueue } = usePlayer();
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={`${title}を再生`}
      onClick={() => {
        playQueue([first], 0);
        router.push(`/albums/${first.albumId}`);
      }}
      className="grid size-10 place-items-center rounded-full bg-black/70 text-white opacity-0 shadow-lg transition-[opacity,scale] duration-150 ease-out group-hover:opacity-100 hover:scale-110 focus-visible:opacity-100 active:scale-95"
    >
      <Icon name="play" className="size-6" />
    </button>
  );
}
