'use client';

import { type RefObject, useCallback, useRef } from 'react';
import { SongList } from '../song-list';
import { FloatingPanel } from './floating-panel';
import { usePlayer } from './player-provider';

/**
 * 次に流れる曲（順番待ち）。流す順（ランダムなら混ぜたあとの順）で並べ、押すとその曲へ飛ぶ。Vocafy から移した。
 * 外枠（開閉・置き場所）は floating-panel.tsx。板の中のスクロールは後ろのページに伝えない
 */
export function QueuePanel({
  open,
  onClose,
  trigger,
}: {
  open: boolean;
  onClose: () => void;
  trigger: RefObject<HTMLButtonElement | null>;
}) {
  const { current, upcoming, jumpTo } = usePlayer();
  // 閉じているあいだは並びを作らない（曲が変わるたびに組み直さない）
  const items = open ? upcoming() : [];
  const list = useRef<HTMLDivElement>(null);
  // 開いたら、並びの先頭から見せる
  const toTop = useCallback(() => list.current?.scrollTo({ top: 0 }), []);
  return (
    <FloatingPanel
      open={open}
      onClose={onClose}
      trigger={trigger}
      title="次に再生する曲"
      onOpened={toTop}
    >
      {current && (
        <div className="px-2">
          <SongList songs={[current]} onPick={onClose} />
        </div>
      )}
      <div ref={list} className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2">
        <SongList songs={items.map((u) => u.item)} onPick={(i) => jumpTo(items[i].index)} />
      </div>
    </FloatingPanel>
  );
}
