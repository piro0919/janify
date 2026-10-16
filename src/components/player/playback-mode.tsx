'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../icon';
import { FloatingPanel } from './floating-panel';
import { usePlayer } from './player-provider';
import { QueuePanel } from './queue-panel';
import type { Sleep } from './use-sleep-timer';

const BUTTON =
  'grid size-10 shrink-0 place-items-center rounded-full transition-[color,scale] duration-150 ease-out active:scale-90';

/**
 * ランダム再生・ループの切り替えと、曲を流しているあいだの次に再生する曲・スリープタイマー。入っているあいだは差し色にする。
 * パソコンでは下の帯に置き、スマホでは帯に入りきらないので、詳細画面の「再生」ボタンの横に置く。
 * 板（次に再生する曲・スリープタイマー）は portal で body の直下に出す。すりガラスの帯の中に置くと、
 * fixed の基準が画面でなく帯になり、板のすりガラスも帯の中しかぼかせない（Vocafy で分かった）
 */
export function PlaybackMode({ className = '' }: { className?: string }) {
  const { current, shuffle, repeat, toggleShuffle, toggleRepeat } = usePlayer();
  const [queueOpen, setQueueOpen] = useState(false);
  const queueButton = useRef<HTMLButtonElement>(null);
  const closeQueue = useCallback(() => setQueueOpen(false), []);
  return (
    <div className={`flex items-center ${className}`}>
      <button
        type="button"
        aria-pressed={shuffle}
        aria-label={shuffle ? 'ランダム再生を止める' : 'ランダム再生'}
        title={shuffle ? 'ランダム再生: 入' : 'ランダム再生: 切'}
        onClick={toggleShuffle}
        className={`${BUTTON} ${shuffle ? 'text-accent' : 'text-muted hover:text-foreground'}`}
      >
        <Icon name="shuffle" className="size-5" />
      </button>
      <button
        type="button"
        aria-label={repeat === 'one' ? 'ループ: 1曲（押すと全体）' : 'ループ: 全体（押すと1曲）'}
        title={repeat === 'one' ? 'ループ: 1曲' : 'ループ: 全体'}
        onClick={toggleRepeat}
        className={`${BUTTON} text-accent`}
      >
        <Icon name={repeat === 'one' ? 'repeatOne' : 'repeat'} className="size-5" />
      </button>
      {current && (
        <button
          ref={queueButton}
          type="button"
          aria-label="次に再生する曲"
          aria-expanded={queueOpen}
          title="次に再生する曲"
          onClick={() => setQueueOpen((open) => !open)}
          className={`${BUTTON} ${queueOpen ? 'text-accent' : 'text-muted hover:text-foreground'}`}
        >
          <Icon name="queue" className="size-5" />
        </button>
      )}
      {current &&
        createPortal(
          <QueuePanel open={queueOpen} onClose={closeQueue} trigger={queueButton} />,
          document.body,
        )}
      {current && <SleepButton />}
    </div>
  );
}

/** スリープタイマーで選べる長さ（分） */
const SLEEP_MINUTES = [15, 30, 45, 60];
const MINUTE_MS = 60 * 1000;
/** 残りの分を数え直す間隔 */
const RECOUNT_MS = 15_000;

/** 残りの分（切り上げ）。RECOUNT_MS ごとに数え直す。タイマーが無ければ null */
function useMinutesLeft(sleep: Sleep | null): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (sleep?.kind !== 'at') return;
    // 入れた直後の残りも、入れた時刻から数える（前に数えた時刻のままだと、残りが長く出る）
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), RECOUNT_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [sleep]);
  return sleep?.kind === 'at' ? Math.max(1, Math.ceil((sleep.at - now) / MINUTE_MS)) : null;
}

/**
 * スリープタイマー。押すと長さを選ぶ板（次に再生する曲と同じ外枠）が開く。入っているあいだは差し色にし、
 * 指を乗せると残りが出る。止め方は use-sleep-timer.ts（時間が来たら音を絞って一時停止、曲の終わりなら次へ進まない）
 */
function SleepButton() {
  const { sleep, setSleep } = usePlayer();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const left = useMinutesLeft(sleep);
  const status =
    sleep?.kind === 'end'
      ? 'この曲が終わったら止まります'
      : left !== null
        ? `あと${left}分で止まります`
        : null;
  const label = status ? `スリープタイマー（${status}）` : 'スリープタイマー';
  const choose = (value: number | 'end' | null) => {
    setSleep(value);
    setOpen(false);
  };
  const row =
    'flex w-full items-center rounded-md px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-foreground/8';
  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-expanded={open}
        title={label}
        onClick={() => setOpen((o) => !o)}
        className={`${BUTTON} ${sleep || open ? 'text-accent' : 'text-muted hover:text-foreground'}`}
      >
        <Icon name="moon" className="size-5" />
      </button>
      {createPortal(
        <FloatingPanel open={open} onClose={close} trigger={trigger} title="スリープタイマー">
          {status && <p className="px-4 pb-1 text-xs text-accent">{status}</p>}
          <div className="grid gap-0.5 px-2 pb-2">
            {SLEEP_MINUTES.map((m) => (
              <button key={m} type="button" onClick={() => choose(m)} className={row}>
                {m < 60 ? `${m}分` : `${m / 60}時間`}
              </button>
            ))}
            <button type="button" onClick={() => choose('end')} className={row}>
              この曲が終わったら
            </button>
            {sleep && (
              <button type="button" onClick={() => choose(null)} className={`${row} text-muted`}>
                タイマーを切る
              </button>
            )}
          </div>
        </FloatingPanel>,
        document.body,
      )}
    </>
  );
}
