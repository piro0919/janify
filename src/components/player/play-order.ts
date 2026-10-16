/**
 * 流す順。ランダムでなければ並びどおり、ランダムなら start を先頭にして残りを混ぜる。
 * 前の曲へ戻ったときに同じ曲へ戻れるよう、混ぜた順は覚えておく
 */
export function buildOrder(
  length: number,
  start: number,
  shuffle: boolean,
  random = Math.random,
): number[] {
  const order = Array.from({ length }, (_, i) => i);
  if (!shuffle) return order;
  const rest = order.filter((i) => i !== start);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [start, ...rest];
}

/**
 * 「再生」で流し始める位置。押すたびに同じ曲から始まらないよう、並びのどこかの曲から始める（Vocafy から移した）。
 * ランダムでなければ、選んだ曲から並びどおりに続け、最後の次は先頭へ戻る（ループは全体か1曲なので、並びは終わらない）
 */
export function playStart(length: number, random = Math.random): number {
  return length > 0 ? Math.floor(random() * length) : 0;
}

/**
 * 次に流れる曲（次に流れる曲の板）。流す順でいまの曲のあとから並べる。ループが全体なら、並びの最後のあとは先頭に戻って
 * 続くので、先頭からいまの曲の手前までも続けて並べる。index は並びの何曲目か（押したときに飛ぶ先）
 */
export function upcomingOf<T>(
  queue: T[],
  order: number[],
  position: number,
  loop: boolean,
): { item: T; index: number }[] {
  return [...order.slice(position + 1), ...(loop ? order.slice(0, position) : [])].flatMap((i) =>
    queue[i] === undefined ? [] : [{ item: queue[i], index: i }],
  );
}
