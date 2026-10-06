'use client';

import Link from 'next/link';
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
import { EASE_OUT, prefersReducedMotion } from '@/lib/motion';
import { Icon } from '../icon';
import { PlayerBar } from './player-bar';
import { loadYouTubeApi, type YTPlayer } from './youtube';

/** 時刻は YouTube から 0.5 秒おきに拾う。at は拾った瞬間で、その間は表示側で補って進める */
export type PlaybackTime = { current: number; duration: number; at: number };

type PlayerContext = {
  queue: QueueItem[];
  index: number;
  current: QueueItem | null;
  playing: boolean;
  /** 曲を選んでから音が出るまで。最初の1曲は YouTube の仕組みの読み込みも待つ */
  loading: boolean;
  /** 曲の一覧を順番待ちに積み、start 番目から再生する */
  playQueue: (items: QueueItem[], start: number) => void;
  /**
   * 流している曲は止めずに、順番待ちだけを差し替える。曲の一覧から押したときは、まずその1曲を
   * 流し始め、アルバムの画面に着いたところでアルバムの曲目に差し替える（album-player.tsx）
   */
  adoptQueue: (items: QueueItem[], index: number) => void;
  toggle: () => void;
  step: (dir: 1 | -1) => void;
  /** 再生をやめ、プレイヤーを消す */
  close: () => void;
  seek: (seconds: number) => void;
  time: PlaybackTime;
  /** 音量（0〜100）と消音。このブラウザに残し、次に開いたときもその音量で始める */
  volume: number;
  muted: boolean;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  /** アルバムの画面で、プレイヤーを大きく置く場所 */
  setSlot: (el: HTMLElement | null) => void;
};

const Context = createContext<PlayerContext | null>(null);

const VOLUME_KEY = 'janify-volume';

/** 残しておいた音量と消音。読めなければ 100 で消音なし */
function savedVolume(): { volume: number; muted: boolean } {
  try {
    const saved = JSON.parse(localStorage.getItem(VOLUME_KEY) ?? 'null') as {
      volume?: unknown;
      muted?: unknown;
    } | null;
    const volume =
      typeof saved?.volume === 'number' ? Math.min(100, Math.max(0, saved.volume)) : 100;
    return { volume, muted: saved?.muted === true };
  } catch {
    return { volume: 100, muted: false };
  }
}

function saveVolume(volume: number, muted: boolean) {
  try {
    localStorage.setItem(VOLUME_KEY, JSON.stringify({ volume, muted }));
  } catch {
    // 保存できない窓では、開き直すと 100 に戻る
  }
}

export function usePlayer(): PlayerContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('usePlayer は PlayerProvider の内側で使う');
  return ctx;
}

type Rect = { top: number; left: number; width: number; height: number };

/** 右下の窓の位置と大きさ。スマホでは下のタブと帯の上、パソコンでは帯の上 */
const DOCK =
  'fixed right-4 bottom-[calc(7.5rem+12px)] h-[200px] w-[min(356px,calc(100vw-2rem))] md:bottom-[calc(4rem+16px)]';
/** 窓のすぐ上に付ける帯 */
const DOCK_STRIP =
  'fixed right-4 bottom-[calc(7.5rem+12px+200px)] h-9 w-[min(356px,calc(100vw-2rem))] md:bottom-[calc(4rem+16px+200px)]';
/** 出入りの動き。閉じたあとは少し下へずらして消す */
const FADE = 'transition-[opacity,translate,visibility] duration-300 ease-(--ease-out)';
const HIDDEN = 'pointer-events-none invisible translate-y-4 opacity-0';

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
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState<PlaybackTime>({ current: 0, duration: 0, at: 0 });
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  // 残しておいた音量は、最初に曲を流したときに読む（サーバーでは localStorage を読めず、帯も曲を流すまで出ない）
  const [sound, setSound] = useState({ volume: 100, muted: false });
  const soundRef = useRef<{ volume: number; muted: boolean } | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  const frame = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  // YouTube の onStateChange は作ったときの関数を持ち続けるので、今の順番待ちは ref にも持つ
  const state = useRef({ queue, index });
  // 曲が終わったときの処理。load から自分自身を呼ぶことになるので、ref を通して呼ぶ
  const onEnded = useRef(() => {});

  const load = useCallback((items: QueueItem[], at: number) => {
    if (!soundRef.current) {
      soundRef.current = savedVolume();
      setSound(soundRef.current);
    }
    state.current = { queue: items, index: at };
    setQueue(items);
    setIndex(at);
    setLoading(true);
    setTime({ current: 0, duration: 0, at: performance.now() });
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
        // 表示はなるべく減らす。操作は Janify の帯でするので、YouTube の操作バーは出さない。
        // 上部の題名と「YouTube で見る」のロゴは、パラメータでは消せない（消そうとして上に重ねるのは規約違反）
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          rel: 0, // 一時停止中の関連動画を、同じチャンネルのものに絞る
          controls: 0,
          iv_load_policy: 3, // 動画の注釈を出さない
          disablekb: 1, // プレイヤー内のキー操作で帯の表示とずれないようにする
        },
        events: {
          onReady: (e) => {
            // 残しておいた音量で始める
            const { volume, muted } = soundRef.current ?? { volume: 100, muted: false };
            e.target.setVolume(volume);
            if (muted) e.target.mute();
            e.target.playVideo();
          },
          onStateChange: ({ data }) => {
            if (data === YT.PlayerState.PLAYING) {
              setPlaying(true);
              setLoading(false);
            }
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

  const adopt = useCallback((items: QueueItem[], at: number) => {
    state.current = { queue: items, index: at };
    setQueue(items);
    setIndex(at);
  }, []);

  const close = useCallback(() => {
    player.current?.destroy();
    player.current = null;
    frame.current?.replaceChildren();
    state.current = { queue: [], index: 0 };
    setQueue([]);
    setIndex(0);
    setPlaying(false);
    setLoading(false);
  }, []);

  // 再生中は時刻を拾う。間は帯の側で補ってなめらかに進める
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const p = player.current;
      if (p)
        setTime({ current: p.getCurrentTime(), duration: p.getDuration(), at: performance.now() });
    }, 500);
    return () => clearInterval(id);
  }, [playing]);

  const current = queue[index] ?? null;
  const mode = queue.length === 0 ? 'none' : slot ? 'slot' : 'dock';

  // 閉じたあとも、帯が下へ消えきるまでは最後の曲を出しておく
  const [shown, setShown] = useState<QueueItem | null>(null);
  if (current && current !== shown) setShown(current);

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

  // 右下の窓と大きな置き場所を行き来するとき、元の位置と大きさから滑らかに移す（FLIP）。
  // 動かすのは見た目の transform だけで、iframe そのものは動かさない
  const lastBox = useRef<DOMRect | null>(null);
  const lastMode = useRef(mode);
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el || (mode === 'slot' && !rect)) return;
    const to = el.getBoundingClientRect();
    const from = lastBox.current;
    const moved = lastMode.current !== mode && lastMode.current !== 'none' && mode !== 'none';
    if (moved && from && to.width > 0 && !prefersReducedMotion()) {
      el.animate(
        [
          {
            transformOrigin: 'top left',
            transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`,
          },
          { transformOrigin: 'top left', transform: 'none' },
        ],
        { duration: 400, easing: EASE_OUT },
      );
    }
    lastMode.current = mode;
    lastBox.current = to;
  }, [mode, rect]);

  // 大きな置き場所はページと一緒に流れるので、移る直前の位置を拾い続ける
  useEffect(() => {
    if (mode !== 'slot') return;
    const onScroll = () => {
      if (frame.current) lastBox.current = frame.current.getBoundingClientRect();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mode]);

  // 右下のプレイヤーが本文の最後を隠さないよう、本文の下の余白を変えるための印
  useEffect(() => {
    document.documentElement.dataset.player = mode;
  }, [mode]);

  const value = useMemo<PlayerContext>(
    () => ({
      queue,
      index,
      current,
      playing,
      loading,
      playQueue: load,
      adoptQueue: adopt,
      toggle: () => (playing ? player.current?.pauseVideo() : player.current?.playVideo()),
      step,
      close,
      seek: (seconds) => {
        player.current?.seekTo(seconds, true);
        setTime((t) => ({ ...t, current: seconds, at: performance.now() }));
      },
      time,
      volume: sound.volume,
      muted: sound.muted,
      setVolume: (volume) => {
        // つまみを動かしたら消音は解く
        const next = { volume, muted: false };
        soundRef.current = next;
        setSound(next);
        saveVolume(volume, false);
        player.current?.setVolume(volume);
        player.current?.unMute();
      },
      toggleMute: () => {
        const now = soundRef.current ?? sound;
        const next = { ...now, muted: !now.muted };
        soundRef.current = next;
        setSound(next);
        saveVolume(next.volume, next.muted);
        if (next.muted) player.current?.mute();
        else player.current?.unMute();
      },
      setSlot,
    }),
    [queue, index, current, playing, loading, load, adopt, step, close, time, sound],
  );

  return (
    <Context value={value}>
      {children}
      {/*
        右下の窓の上に付ける帯。押すと曲の入ったアルバムの画面に移り、そこで大きく出る。
        窓の中は YouTube のプレイヤーで、押すと YouTube 側の操作になるので、入口は窓の外に置く
      */}
      <div
        aria-hidden={mode !== 'dock'}
        inert={mode !== 'dock'}
        className={`${DOCK_STRIP} ${FADE} z-30 flex items-center rounded-t-lg bg-bar ${mode === 'dock' ? '' : HIDDEN}`}
      >
        {shown && (
          <Link
            href={`/albums/${shown.albumId}`}
            className="flex h-full min-w-0 flex-1 items-center gap-2 pl-3 text-xs text-muted transition-colors hover:text-foreground"
          >
            <span className="min-w-0 flex-1 truncate">
              <span className="font-bold text-foreground">{shown.title}</span>
              {' ・ '}
              {shown.albumTitle}
            </span>
            <Icon name="expand" className="size-4 shrink-0" />
          </Link>
        )}
        {/* 窓だけ消して音を流し続けることはできない（プレイヤーは見えている必要がある）ので、下の帯の × と同じく再生ごと止める */}
        <button
          type="button"
          aria-label="プレイヤーを閉じる"
          onClick={close}
          className="grid h-full w-9 shrink-0 place-items-center text-muted transition-[color,scale] duration-150 ease-out hover:text-foreground active:scale-90"
        >
          <Icon name="close" className="size-4" />
        </button>
      </div>
      {/* プレイヤーの上には何も重ねない（YouTube の規約）。200×200 を下回らない */}
      <div
        ref={frame}
        style={mode === 'slot' && rect ? rect : undefined}
        className={
          mode === 'slot'
            ? 'absolute z-10 overflow-hidden rounded-lg bg-black [&>iframe]:size-full'
            : `${DOCK} ${FADE} z-30 overflow-hidden rounded-b-lg bg-black shadow-2xl shadow-black/20 dark:shadow-black/60 [&>iframe]:size-full ${mode === 'none' ? HIDDEN : ''}`
        }
      />
      <PlayerBar item={shown} open={mode !== 'none'} />
    </Context>
  );
}
