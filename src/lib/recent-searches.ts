'use client';

import { createLocalList } from './local-list';

/**
 * 最近の検索の言葉（Vocafy から移した）。検索の結果を押したときの言葉を、このブラウザの localStorage に新しい順で残す。
 * 打っただけの言葉（途中の「あ」「あら」など）は残さない
 */
const KEY = 'janify-recent-searches';
const LIMIT = 8;
const isWord = (value: unknown): value is string => typeof value === 'string';
const { read, write, useItems } = createLocalList(KEY, isWord);

/** 言葉を先頭に足す。同じ言葉があれば先頭へ移す */
export function addRecentSearch(q: string) {
  const now = read();
  if (now[0] === q) return;
  write([q, ...now.filter((s) => s !== q)].slice(0, LIMIT));
}

export function clearRecentSearches() {
  write([]);
}

export function useRecentSearches(): string[] {
  return useItems();
}
