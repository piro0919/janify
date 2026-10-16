'use client';

import { useEffect, useState } from 'react';
import { loadLibraryIndex } from '@/components/favorites/use-library';
import { SongList } from '@/components/song-list';
import type { LibraryIndex } from '@/lib/library';
import { clearHistory, useHistory } from '@/lib/history';

/**
 * 最近聴いた曲を新しい順に全部（残すのは100曲まで。Vocafy から移した）。押すと、ほかの一覧と同じく
 * その曲の入ったアルバムの画面へ移って流す。掲載を外した曲は、履歴に鍵が残っていても出さない
 */
export function HistoryView() {
  const history = useHistory();
  const [index, setIndex] = useState<LibraryIndex | null>(null);
  const any = history.length > 0;

  useEffect(() => {
    if (any && !index) void loadLibraryIndex().then(setIndex);
  }, [any, index]);

  if (!any)
    return <p className="pt-4 text-muted">まだ履歴がありません。聴いた曲がここに並びます。</p>;
  if (!index) return <p className="pt-4 text-muted">読み込んでいます…</p>;
  const songs = history.flatMap((k) => index.songs[k] ?? []);

  return (
    <>
      <div className="mb-3 flex items-center gap-3">
        <span className="text-sm text-muted">{songs.length} 曲</span>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('視聴履歴をすべて削除しますか？')) clearHistory();
          }}
          className="ml-auto rounded-full border border-line/60 bg-sidebar/60 px-3 py-1 text-xs font-bold text-foreground transition-colors hover:bg-sidebar/90"
        >
          履歴を削除
        </button>
      </div>
      <SongList songs={songs} />
    </>
  );
}
