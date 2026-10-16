// YouTube の IFrame API のうち、使う分だけの型と読み込み
export type YTPlayer = {
  loadVideoById(id: string): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  destroy(): void;
};
export type YTNamespace = {
  Player: new (
    el: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, number>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: { data: number }) => void;
        /** 再生できない動画（削除・非公開・埋め込み不可・有料会員限定など）。data はエラーの番号 */
        onError?: (e: { data: number }) => void;
      };
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
/**
 * YouTube の仕組み（iframe_api）を読み込む。読み込めなかったとき（広告ブロックなどで止められたとき）は失敗にし、
 * 次に呼んだときに読み込み直す。失敗しても待ち続けると、帯の再生ボタンが読み込み中のまま固まる（Vocafy で確かめた）
 */
export function loadYouTubeApi(): Promise<YTNamespace> {
  apiReady ??= new Promise<YTNamespace>((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT);
    window.onYouTubeIframeAPIReady = () => {
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => {
      script.remove();
      apiReady = undefined;
      reject(new Error('YouTube の仕組みを読み込めませんでした'));
    };
    document.head.append(script);
  });
  return apiReady;
}
