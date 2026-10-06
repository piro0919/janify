'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { QueueItem } from '@/lib/catalog';
import { PlayerBar } from './player-bar';
import { loadYouTubeApi, type YTPlayer } from './youtube';

type PlayerContext = {
  queue: QueueItem[];
  index: number;
  current: QueueItem | null;
  playing: boolean;
  /** 曲の一覧を順番待ちに積み、start 番目から再生する */
  playQueue: (items: QueueItem[], start: number) => void;
  toggle: () => void;
  step: (dir: 1 | -1) => void;
  /** 再生をやめ、プレイヤーを消す */
  close: () => void;
  seek: (seconds: number) => void;
  /** 今の時刻と曲の長さ（秒）。再生中だけ進む */
  time: { current: number; duration: number };
  /** アルバムの画面で、プレイヤーを大きく置く場所 */
  setSlot: (el: HTMLElement | null) => void;
};

const Context = createContext<PlayerContext | null>(null);

export function usePlayer(): PlayerContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('usePlayer は PlayerProvider の内側で使う');
  return ctx;
}

type Rect = { top: number; left: number; width: number; height: number };

/**
 * ページを移っても再生が続く、全ページ共通のプレイヤー。ルートのレイアウトに1つだけ置く。
 *
 * YouTube の規約で、プレイヤーは 200×200 以上で常に見えていなければならず、上に何も重ねられない。
 * そのため小さく畳まず、右下に 200 の高さで出したままにする（dock）。アルバムの画面では、
 * そのアルバムの曲を流している間だけ、画面内の置き場所（slot）に重ねて大きく出す。
 * iframe を DOM の中で動かすと読み込み直しになり再生が止まるので、要素は動かさず位置だけ合わせる
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState({ current: 0, duration: 0 });
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  const frame = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  // YouTube の onStateChange は作ったときの関数を持ち続けるので、今の順番待ちは ref にも持つ
  const state = useRef({ queue, index });
  // 曲が終わったときの処理。load から自分自身を呼ぶことになるので、ref を通して呼ぶ
  const onEnded = useRef(() => {});

  const load = useCallback((items: QueueItem[], at: number) => {
    state.current = { queue: items, index: at };
    setQueue(items);
    setIndex(at);
    setTime({ current: 0, duration: 0 });
    const videoId = items[at].videoId;
    if (player.current) {
      player.current.loadVideoById(videoId);
      return;
    }
    void loadYouTubeApi().then((YT) => {
      if (!frame.current || player.current) return;
      const el = document.createElement('div');
      frame.current.replaceChildren(el);
      player.current = new YT.Player(el, {
        videoId,
        playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
        events: {
          onReady: (e) => e.target.playVideo(),
          onStateChange: ({ data }) => {
            if (data === YT.PlayerState.PLAYING) setPlaying(true);
            if (data === YT.PlayerState.PAUSED) setPlaying(false);
            if (data === YT.PlayerState.ENDED) onEnded.current();
          },
        },
      });
    });
  }, []);

  useEffect(() => {
    // 曲が終わったら、順番待ちの次の曲へ。最後の曲なら止まる
    onEnded.current = () => {
      const { queue: q, index: i } = state.current;
      if (i + 1 < q.length) load(q, i + 1);
      else setPlaying(false);
    };
  }, [load]);

  const step = useCallback(
    (dir: 1 | -1) => {
      const { queue: q, index: i } = state.current;
      if (q[i + dir]) load(q, i + dir);
    },
    [load],
  );

  const close = useCallback(() => {
    player.current?.destroy();
    player.current = null;
    frame.current?.replaceChildren();
    state.current = { queue: [], index: 0 };
    setQueue([]);
    setIndex(0);
    setPlaying(false);
  }, []);

  // 再生中は時刻を拾って進み具合を出す
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const p = player.current;
      if (p) setTime({ current: p.getCurrentTime(), duration: p.getDuration() });
    }, 500);
    return () => clearInterval(id);
  }, [playing]);

  const mode = queue.length === 0 ? 'none' : slot ? 'slot' : 'dock';

  // アルバムの画面の置き場所に、位置と大きさを合わせる。ページの高さが変わるたびに測り直す。
  // ResizeObserver は observe した時点でも一度呼ぶので、最初の測定もここで済む
  useLayoutEffect(() => {
    if (!slot) return;
    const measure = () => {
      const r = slot.getBoundingClientRect();
      setRect({
        top: r.top + window.scrollY,
        left: r.left + window.scrollX,
        width: r.width,
        height: r.height,
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(slot);
    observer.observe(document.body);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [slot]);

  // 右下のプレイヤーが本文の最後を隠さないよう、本文の下の余白を変えるための印
  useEffect(() => {
    document.documentElement.dataset.player = mode;
  }, [mode]);

  const value = useMemo<PlayerContext>(
    () => ({
      queue,
      index,
      current: queue[index] ?? null,
      playing,
      playQueue: load,
      toggle: () => (playing ? player.current?.pauseVideo() : player.current?.playVideo()),
      step,
      close,
      seek: (seconds) => {
        player.current?.seekTo(seconds, true);
        setTime((t) => ({ ...t, current: seconds }));
      },
      time,
      setSlot,
    }),
    [queue, index, playing, load, step, close, time],
  );

  return (
    <Context value={value}>
      {children}
      {/* プレイヤーの上には何も重ねない（YouTube の規約）。200×200 を下回らない */}
      <div
        ref={frame}
        style={mode === 'slot' && rect ? rect : undefined}
        className={
          mode === 'none'
            ? 'hidden'
            : mode === 'dock'
              ? 'fixed right-4 bottom-[calc(7.5rem+12px)] z-30 h-[200px] w-[min(356px,calc(100vw-2rem))] overflow-hidden rounded-lg bg-black shadow-2xl shadow-black/60 md:bottom-[calc(4rem+16px)] [&>iframe]:size-full'
              : 'absolute z-10 overflow-hidden rounded-lg bg-black [&>iframe]:size-full'
        }
      />
      {queue.length > 0 && <PlayerBar />}
    </Context>
  );
}
