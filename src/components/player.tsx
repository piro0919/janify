"use client";

import { useEffect, useRef, useState } from "react";
import type { Track } from "@/lib/catalog";

// YouTube の IFrame API のうち、使う分だけの型
type YTPlayer = {
  loadVideoById(id: string): void;
  cueVideoById(id: string): void;
  playVideo(): void;
  pauseVideo(): void;
  destroy(): void;
};
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, number>;
      events?: { onStateChange?: (e: { data: number }) => void };
    },
  ) => YTPlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiReady: Promise<YTNamespace> | undefined;
function loadApi(): Promise<YTNamespace> {
  apiReady ??= new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT!);
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.append(script);
  });
  return apiReady;
}

export function Player({ tracks }: { tracks: Track[] }) {
  const playable = tracks.flatMap((t, i) => (t.videoId ? [i] : []));
  const [current, setCurrent] = useState(playable[0]);
  const [playing, setPlaying] = useState(false);
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  // onStateChange は作ったときの関数を持ち続けるので、いまの曲は ref にも持つ
  const currentRef = useRef(current);

  const play = (index: number) => {
    currentRef.current = index;
    setCurrent(index);
    player.current?.loadVideoById(tracks[index].videoId!);
  };

  const step = (dir: 1 | -1) => {
    const next = playable[playable.indexOf(currentRef.current) + dir];
    if (next === undefined) return false;
    play(next);
    return true;
  };

  useEffect(() => {
    let cancelled = false;
    loadApi().then((YT) => {
      if (cancelled || !holder.current) return;
      const el = document.createElement("div");
      holder.current.replaceChildren(el);
      player.current = new YT.Player(el, {
        videoId: tracks[currentRef.current].videoId!,
        playerVars: { playsinline: 1, rel: 0 },
        events: {
          onStateChange: ({ data }) => {
            if (data === YT.PlayerState.PLAYING) setPlaying(true);
            if (data === YT.PlayerState.PAUSED) setPlaying(false);
            // 曲が終わったら、アルバムの次の再生できる曲へ進む
            if (data === YT.PlayerState.ENDED && !step(1)) setPlaying(false);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      player.current?.destroy();
      player.current = null;
    };
    // プレイヤーはアルバムを開いたときに一度だけ作る
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const at = playable.indexOf(current);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div>
        {/* プレイヤーの上には何も重ねない（YouTube の規約） */}
        <div ref={holder} className="aspect-video w-full overflow-hidden rounded-lg bg-black [&>iframe]:h-full [&>iframe]:w-full" />
        <div className="mt-4 flex items-center justify-center gap-6">
          <ControlButton label="前の曲" disabled={at <= 0} onClick={() => step(-1)}>
            <path d="M6 5h2v14H6zM20 5v14L9 12z" />
          </ControlButton>
          <ControlButton
            label={playing ? "一時停止" : "再生"}
            large
            onClick={() => (playing ? player.current?.pauseVideo() : player.current?.playVideo())}
          >
            {playing ? <path d="M6 5h4v14H6zM14 5h4v14h-4z" /> : <path d="M7 4v16l13-8z" />}
          </ControlButton>
          <ControlButton label="次の曲" disabled={at >= playable.length - 1} onClick={() => step(1)}>
            <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
          </ControlButton>
        </div>
      </div>

      <ol className="self-start">
        {tracks.map((track, i) => (
          <li key={i}>
            <button
              type="button"
              disabled={!track.videoId}
              onClick={() => play(i)}
              className={`flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-left ${
                i === current ? "bg-surface text-accent" : "hover:bg-surface"
              } disabled:cursor-default disabled:text-muted/50 disabled:hover:bg-transparent`}
            >
              <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted">{i + 1}</span>
              <span className="truncate">{track.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ControlButton({
  label,
  large,
  disabled,
  onClick,
  children,
}: {
  label: string;
  large?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid place-items-center rounded-full disabled:opacity-30 ${
        large ? "size-14 bg-foreground text-background" : "size-10 text-foreground hover:bg-surface"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className={large ? "size-7" : "size-6"} aria-hidden>
        {children}
      </svg>
    </button>
  );
}
