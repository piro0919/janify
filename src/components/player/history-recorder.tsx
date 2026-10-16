'use client';

import { useEffect } from 'react';
import { addToHistory } from '@/lib/history';
import { songKeyOf } from '@/lib/library';
import { usePlayer } from './player-provider';

/**
 * 流し始めた曲を視聴履歴（src/lib/history.ts）に残す。画面には何も出さない。
 * 選んだだけで流れていない曲（開き直して戻した、止まったままの曲など）は残さず、実際に鳴り始めたときに残す
 */
export function HistoryRecorder() {
  const { current, playing } = usePlayer();
  useEffect(() => {
    if (playing && current) addToHistory(songKeyOf(current));
  }, [current, playing]);
  return null;
}
