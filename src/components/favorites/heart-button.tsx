'use client';

import { useState } from 'react';
import { Icon } from '../icon';
import { type FavoriteKind, toggleFavorite } from './favorites-store';
import { useFavorites } from './use-favorites';

/** お気に入りの入れ外し。入れると差し色のハートになり、少し弾む */
export function HeartButton({
  kind,
  itemKey,
  label,
  className = '',
  size = 'size-5',
  quiet,
}: {
  kind: FavoriteKind;
  itemKey: string;
  /** 読み上げ用。「〇〇をお気に入りに追加」の〇〇 */
  label: string;
  className?: string;
  size?: string;
  /**
   * 一覧の行に置くとき。入っていないハートは、マウスを載せたときだけ出す。
   * マウスの無いスマホでは常に出す
   */
  quiet?: boolean;
}) {
  const on = useFavorites()[kind].includes(itemKey);
  // 弾ませるのは押して入れたときだけ。開いたときにすでに入っているハートは動かさない
  const [pop, setPop] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `${label}をお気に入りから外す` : `${label}をお気に入りに追加`}
      title={on ? 'お気に入りから外す' : 'お気に入りに追加'}
      onClick={(e) => {
        // 行やカードの中に置いたとき、外側の再生や画面の移動まで起こさない
        e.preventDefault();
        e.stopPropagation();
        setPop(!on);
        toggleFavorite(kind, itemKey);
      }}
      className={`grid shrink-0 place-items-center rounded-full transition-[color,scale] duration-150 ease-out active:scale-75 ${
        on ? 'text-accent' : 'text-muted hover:text-foreground'
      } ${
        quiet && !on
          ? 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100'
          : ''
      } ${className}`}
    >
      <Icon
        name={on ? 'heartFilled' : 'heart'}
        className={`${size} ${on && pop ? 'animate-[pop_0.3s_var(--ease-out)]' : ''}`}
      />
    </button>
  );
}
