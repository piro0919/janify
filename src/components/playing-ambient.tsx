'use client';

import { thumbOf } from '@/lib/thumb';
import { Ambient, BRAND_COLORS } from './ambient';
import { usePlayer } from './player/player-provider';

/**
 * 代表の1枚が無い画面（トップ・一覧・ライブラリ・検索・設定）の上部の色の背景。
 * 流している曲のサムネイルから色を取り、曲が変わると色も移り変わる。何も流していないときは、Janify の差し色にする
 */
export function PlayingAmbient() {
  const { current } = usePlayer();
  return <Ambient image={current ? thumbOf(current.videoId) : null} fallback={BRAND_COLORS} />;
}
