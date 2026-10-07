'use client';

import { useState } from 'react';
import { Icon } from '../icon';
import { type FavoriteKind, toggleFavorite } from './favorites-store';
import { useFavorites } from './use-favorites';

/** 押して入れたときに周りへ散る点の向き（度） */
const SPARKS = [0, 60, 120, 180, 240, 300];

/** お気に入りの入れ外し。入れると桃色のハートになり、弾んで小さな点が散る */
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
  // 押すたびに数を増やし、続けて押しても動きを頭からやり直す
  const [pop, setPop] = useState(0);
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
        setPop((n) => (on ? 0 : n + 1));
        toggleFavorite(kind, itemKey);
      }}
      className={`grid shrink-0 place-items-center rounded-full transition-[color,scale] duration-150 ease-out active:scale-75 ${
        on ? 'text-heart' : 'text-muted hover:text-heart'
      } ${
        quiet && !on
          ? 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100'
          : ''
      } ${className}`}
    >
      <span className={`relative grid place-items-center ${size}`}>
        {on && pop > 0 && (
          <span key={`burst-${pop}`} aria-hidden className="pointer-events-none absolute inset-0">
            {SPARKS.map((deg) => (
              <span key={deg} className="absolute inset-0" style={{ rotate: `${deg}deg` }}>
                <span className="absolute left-1/2 size-[20%] animate-[heart-spark_0.5s_var(--ease-out)_0.05s_both] rounded-full bg-heart" />
              </span>
            ))}
          </span>
        )}
        <Icon
          key={`heart-${pop}`}
          name={on ? 'heartFilled' : 'heart'}
          className={`relative ${size} ${on && pop > 0 ? 'animate-[pop_0.4s_var(--ease-out)]' : ''}`}
        />
      </span>
    </button>
  );
}
