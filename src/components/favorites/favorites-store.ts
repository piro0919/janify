'use client';

/**
 * お気に入りの保存場所。いまはログインが無いので、ブラウザの localStorage にだけ置く。
 * 後でログインを入れたら、comic-time と同じく、読むのはここのまま、入れ外しのたびに DB にも書く。
 *
 * localStorage を読むのはこのファイルだけにする。一覧の各行で読むと、件数ぶん読み直しが走る
 * （comic-time では iPhone のホーム画面のアプリが落ちた）。読んだ結果は文字列が変わるまで使い回す
 */

export type FavoriteKind = 'songs' | 'albums' | 'artists';
/** どれも新しく入れた順。曲の鍵は songKeyOf（src/lib/library.ts）、アルバムとアーティストは id */
export type Favorites = Record<FavoriteKind, string[]>;

const STORAGE_KEY = 'janify-favorites-v1';
const CHANGE_EVENT = 'janify-favorites-change';
const EMPTY: Favorites = { songs: [], albums: [], artists: [] };

// 読んだ結果。localStorage を読むのは、最初の1回と、変更を知らされたときだけ
let cached: Favorites | null = null;
const listeners = new Set<() => void>();

function read(): Favorites {
  try {
    return parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    // 閲覧履歴を残さない窓などでは読めないことがある。そのときはお気に入りなしとして動く
    return EMPTY;
  }
}

function parse(raw: string | null): Favorites {
  if (!raw) return EMPTY;
  try {
    const data = JSON.parse(raw) as Partial<Favorites>;
    const list = (v: unknown) =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
    return { songs: list(data.songs), albums: list(data.albums), artists: list(data.artists) };
  } catch {
    return EMPTY;
  }
}

/** 変更を知らされたら1回だけ読み直し、使っている部品すべてに知らせる */
function refresh() {
  cached = read();
  for (const listener of listeners) listener();
}

export function getFavorites(): Favorites {
  cached ??= read();
  return cached;
}

export function getServerFavorites(): Favorites {
  return EMPTY;
}

/** 別のタブでの変更（storage）と、このタブでの変更の両方で知らせる */
export function subscribeFavorites(onChange: () => void): () => void {
  if (listeners.size === 0) {
    window.addEventListener('storage', refresh);
    window.addEventListener(CHANGE_EVENT, refresh);
  }
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(CHANGE_EVENT, refresh);
    }
  };
}

/**
 * 外したばかりのものの元の位置。外したあと同じ画面でもう一度入れたら、先頭ではなく元の位置に戻す。
 * 開いているあいだだけ覚えておけばよいので、保存はしない
 */
const removedAt = new Map<string, number>();

export function toggleFavorite(kind: FavoriteKind, key: string): void {
  const list = getFavorites()[kind];
  const at = list.indexOf(key);
  let next: string[];
  if (at >= 0) {
    removedAt.set(`${kind}:${key}`, at);
    next = list.filter((k) => k !== key);
  } else {
    const back = removedAt.get(`${kind}:${key}`);
    removedAt.delete(`${kind}:${key}`);
    next = [...list];
    next.splice(back === undefined ? 0 : Math.min(back, next.length), 0, key);
  }
  write(kind, next);
}

/** 並べ替え。見えている順に鍵を並べて渡す。掲載を外して見えなくなった鍵は、後ろにそのまま残す */
export function setFavoriteOrder(kind: FavoriteKind, keys: string[]): void {
  const list = getFavorites()[kind];
  const rest = list.filter((k) => !keys.includes(k));
  write(kind, [...keys.filter((k) => list.includes(k)), ...rest]);
}

function write(kind: FavoriteKind, list: string[]) {
  const next: Favorites = { ...getFavorites(), [kind]: list };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 容量切れや保存できない窓では、入れ外しが残らない。画面は前の状態のまま
    return;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
