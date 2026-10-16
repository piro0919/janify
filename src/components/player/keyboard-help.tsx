/**
 * プレイヤーのキー操作の一覧（player-keys.tsx と同じ割り当て）。設定の画面と、? で開く板の両方に出す。
 * 設定の画面では、キーボードのないスマホでは出さない
 */
const KEYS: [string, string][] = [
  ['Space / K', '再生・一時停止'],
  ['← / →', '5秒戻る・進む'],
  ['J / L', '10秒戻る・進む'],
  ['0〜9', '曲の0〜90%の位置へ'],
  ['Shift + ← / →', '前の曲・次の曲'],
  ['Shift + P / N', '前の曲・次の曲'],
  ['↑ / ↓', '音量を上げる・下げる'],
  ['M', '消音'],
  ['S', 'ランダム再生'],
  ['R', 'ループ'],
  ['/', '検索'],
  ['?', 'キーボード操作の一覧'],
];

export function KeyList() {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 px-3 text-sm">
      {KEYS.map(([key, label]) => (
        <div key={key} className="contents">
          <dt>
            <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-sans text-xs">
              {key}
            </kbd>
          </dt>
          <dd className="text-muted">{label}</dd>
        </div>
      ))}
    </dl>
  );
}

export function KeyboardHelp() {
  return (
    <section className="mt-7 hidden sm:mt-10 md:block">
      <h2 className="mb-3 font-bold">キーボード操作</h2>
      <KeyList />
    </section>
  );
}
