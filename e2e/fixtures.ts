import { test as base, expect, type Page } from '@playwright/test';

/**
 * E2E では本物の YouTube を使わない（Vocafy から移した）。自動のブラウザでは Topic の音源の一部が流せずに
 * 次の曲へ勝手に進み（CLAUDE.md の落とし穴）、外への通信が遅いと落ちることもあるため。
 *
 * - YouTube の仕組み（iframe_api）は、本物と同じ形でプレイヤーを作る偽物を返す。頼まれたら「再生中」を知らせ、
 *   一時停止を頼まれたら「一時停止」を知らせる。曲が終わったり流せなかったりはしないので、勝手に次の曲へは進まない
 * - YouTube の埋め込みのページは空のページを返す。テストは埋め込みの住所（src）で、どの曲を流したかを見る
 * - 曲の終わりは、テストから window.__ytEnd() で起こす
 *
 * 曲送りを確かめるテストは、Shift+→ などで明示して送る
 */

/** YouTube の IFrame API の偽物。youtube.ts が使う分だけ */
const FAKE_IFRAME_API = `
(() => {
  const STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2 };
  class Player {
    constructor(el, options) {
      this.events = options.events || {};
      this.current = 0;
      this.iframe = document.createElement('iframe');
      el.replaceWith(this.iframe);
      if (options.videoId) this.show(options.videoId);
      // テストから曲の終わりを起こす口（window.__ytEnd()）
      window.__ytEnd = () => this.state(STATE.ENDED);
      // 本物は、onReady より前には操作の関数（getCurrentTime・loadVideoById など）を持たない。偽物も同じにして、
      // 準備の前に呼んで落ちる誤りをテストで拾う
      setTimeout(() => {
        Object.assign(this, READY_METHODS);
        if (this.events.onReady) this.events.onReady({ target: this });
      }, window.__ytReadyDelay ?? 300);
    }
    show(id) {
      this.iframe.src = 'https://www.youtube.com/embed/' + id + '?enablejsapi=1';
    }
    state(data) {
      setTimeout(() => this.events.onStateChange && this.events.onStateChange({ data }), 0);
    }
    destroy() { this.iframe.remove(); }
  }
  const READY_METHODS = {
    loadVideoById(arg) {
      const id = typeof arg === 'string' ? arg : arg.videoId;
      this.current = typeof arg === 'string' ? 0 : arg.startSeconds || 0;
      this.show(id);
      this.state(STATE.PLAYING);
    },
    playVideo() { this.state(STATE.PLAYING); },
    pauseVideo() { this.state(STATE.PAUSED); },
    stopVideo() {},
    seekTo(seconds) { this.current = seconds; },
    getCurrentTime() { return this.current; },
    getDuration() { return 200; },
    setVolume() {},
    mute() {},
    unMute() {},
  };
  window.YT = { Player, PlayerState: STATE };
  if (window.onYouTubeIframeAPIReady) window.onYouTubeIframeAPIReady();
})();
`;

const BLANK = '<!doctype html><title>embed</title>';

/** 動画の仕組みを偽物に差し替える */
async function fakeVideos(page: Page) {
  await page.route('https://www.youtube.com/iframe_api', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: FAKE_IFRAME_API }),
  );
  await page.route('https://www.youtube.com/embed/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: BLANK }),
  );
}

export const test = base.extend({
  // 2つ目の引数は Playwright の「この値でテストを走らせる」関数。use という名前だと React のフックの規則に掛かるので、名前を替える
  page: async ({ page }, provide) => {
    await fakeVideos(page);
    // 画面が出ていても、裏で例外が起きていたら落とす（準備前のプレイヤーを呼んで落ちたのを見逃していた）
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await provide(page);
    expect(errors, 'ページで例外が起きた').toEqual([]);
  },
});

export { expect };
