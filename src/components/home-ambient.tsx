'use client';

import { thumbOf } from '@/lib/thumb';
import { Ambient, BRAND_COLORS } from './ambient';
import { usePlayer } from './player/player-provider';

/**
 * トップの上部の色の背景。トップには代表の1枚が無いので、流している曲のサムネイルから色を取る。
 * 曲が変わると色も移り変わる。何も流していないときは、Janify の差し色にする
 */
export function HomeAmbient() {
  const { current } = usePlayer();
  return <Ambient image={current ? thumbOf(current.videoId) : null} fallback={BRAND_COLORS} />;
}
