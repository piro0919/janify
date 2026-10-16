'use client';

import { useSyncExternalStore } from 'react';
import { type DockSide, savedDockSide, saveDockSide, subscribeDockSide } from './dock-side';

const OPTIONS: { value: DockSide; label: string }[] = [
  { value: 'right', label: '右' },
  { value: 'left', label: '左' },
];

/**
 * 設定の画面の「ミニプレーヤーの位置」。ほかの画面で流しているときの小さな窓を、右と左のどちらに出すか。
 * 帯を横に引いても変えられるが、引けることは見て分からないので、見て分かる入り口はここ（Vocafy から移した）
 */
export function DockSetting() {
  const side = useSyncExternalStore(subscribeDockSide, savedDockSide, (): DockSide => 'right');
  return (
    <section className="mt-7 sm:mt-10">
      <h2 className="mb-3 font-bold">ミニプレーヤーの位置</h2>
      <div className="grid gap-1">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-150 hover:bg-foreground/8"
          >
            <input
              type="radio"
              name="dock-side"
              value={o.value}
              checked={side === o.value}
              onChange={() => saveDockSide(o.value)}
              className="size-4 accent-accent"
            />
            {o.label}
          </label>
        ))}
      </div>
    </section>
  );
}
