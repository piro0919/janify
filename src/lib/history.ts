'use client';

import { createLocalList } from './local-list';

/**
 * 視聴履歴（Vocafy から移した）。流し始めた曲の鍵（songKeyOf）を、このブラウザの localStorage に新しい順で残す。
 * お気に入りと同じく鍵だけを残し、画面は /library-index と突き合わせて出す（掲載を外した曲は見えなくなる）。
 * 同じ曲をもう一度聴いたら先頭へ移す
 */
const KEY = 'janify-history-v1';
/** 残す曲の数。それより古いものは消す */
const LIMIT = 100;
const isKey = (value: unknown): value is string => typeof value === 'string';
const { read, write, useItems } = createLocalList(KEY, isKey);

/** 流し始めた曲を先頭に足す。すでにあれば先頭へ移す */
export function addToHistory(key: string) {
  const now = read();
  if (now[0] === key) return;
  write([key, ...now.filter((k) => k !== key)].slice(0, LIMIT));
}

export function clearHistory() {
  write([]);
}

export function useHistory(): string[] {
  return useItems();
}
