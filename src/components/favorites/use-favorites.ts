'use client';

import { useSyncExternalStore } from 'react';
import { getFavorites, getServerFavorites, subscribeFavorites } from './favorites-store';

/** お気に入りの一覧。localStorage は読まず、favorites-store が持っている結果を返す */
export function useFavorites() {
  return useSyncExternalStore(subscribeFavorites, getFavorites, getServerFavorites);
}
