'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ARTIST_GRID, COVER_GRID, CoverCard } from '@/components/cover-card';
import { SongList } from '@/components/song-list';
import { addRecentSearch, clearRecentSearches, useRecentSearches } from '@/lib/recent-searches';
import { search, type SearchIndex } from '@/lib/search';
import { Heading } from '@/components/heading';

let loading: Promise<SearchIndex> | undefined;
const loadIndex = () =>
  (loading ??= fetch('/search-index').then((r) => r.json() as Promise<SearchIndex>));

/** 見出しの上に添える小さな英字 */
const EYEBROW: Record<string, string> = {
  楽曲: 'Songs',
  アルバム: 'Albums',
  アーティスト: 'Artists',
};

/** 出しすぎると一覧が長くなるので、種類ごとに上限を設ける */
const LIMIT = { artists: 10, albums: 20, songs: 50 };

export function SearchResults() {
  const query = useSearchParams().get('q') ?? '';
  const [index, setIndex] = useState<SearchIndex | null>(null);

  useEffect(() => {
    void loadIndex().then(setIndex);
  }, []);

  const result = useMemo(() => (index ? search(index, query) : null), [index, query]);
  const recent = useRecentSearches();
  const router = useRouter();

  if (!query.trim()) {
    return (
      <>
        <p className="pt-8 text-muted">曲名・アルバム名・アーティスト名で探せます。</p>
        {/* 最近の検索の言葉（recent-searches.ts）。押すとその言葉で探す */}
        {recent.length > 0 && (
          <section className="mt-7 sm:mt-10">
            <div className="mb-4 flex items-end gap-3">
              <Heading eyebrow="Recent">最近の検索</Heading>
              <button
                type="button"
                onClick={clearRecentSearches}
                className="mb-1 ml-auto rounded-full border border-line/60 bg-sidebar/60 px-3 py-1 text-xs font-bold text-foreground transition-colors hover:bg-sidebar/90"
              >
                検索履歴を削除
              </button>
            </div>
            <ul className="flex flex-wrap gap-2">
              {recent.map((q) => (
                <li key={q} className="min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false })
                    }
                    title={q}
                    // 長い言葉は「…」で切り、札が画面からはみ出さないようにする
                    className="block max-w-60 truncate rounded-full border border-line/60 bg-sidebar/60 px-4 py-1.5 text-sm transition-colors hover:bg-sidebar/90"
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </>
    );
  }
  if (!index) return <p className="pt-8 text-muted">読み込んでいます…</p>;
  if (!result || (!result.artists.length && !result.albums.length && !result.songs.length)) {
    return <p className="pt-8 text-muted">「{query}」に当てはまるものはありませんでした。</p>;
  }

  return (
    // 結果（曲・アーティスト・アルバム）を押したら、そのときの言葉を最近の検索に残す。打っただけの言葉は残さない
    <div
      className="pt-4"
      onClickCapture={(e) => {
        const hit = (e.target as HTMLElement).closest('a, button');
        // 曲の行のハートは結果を選んだことにならないので数えない
        if (hit && !hit.matches('[aria-pressed]')) addRecentSearch(query.trim());
      }}
    >
      {result.songs.length > 0 && (
        <Section title="楽曲" count={result.songs.length} limit={LIMIT.songs}>
          <SongList songs={result.songs.slice(0, LIMIT.songs)} />
        </Section>
      )}
      {result.artists.length > 0 && (
        <Section title="アーティスト" count={result.artists.length} limit={LIMIT.artists}>
          <div className={ARTIST_GRID}>
            {result.artists.slice(0, LIMIT.artists).map((a) => (
              <CoverCard
                key={a.id}
                href={`/artists/${a.id}`}
                playing={{ artistId: a.id }}
                cover={a.cover}
                round
                title={a.name}
                sub={a.sub}
              />
            ))}
          </div>
        </Section>
      )}
      {result.albums.length > 0 && (
        <Section title="アルバム" count={result.albums.length} limit={LIMIT.albums}>
          <div className={COVER_GRID}>
            {result.albums.slice(0, LIMIT.albums).map((a) => (
              <CoverCard
                key={a.id}
                href={`/albums/${a.id}`}
                playing={{ albumId: a.id }}
                cover={a.cover}
                title={a.title}
                sub={[a.artistName, a.year && `${a.year}年`].filter(Boolean).join(' ・ ')}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  limit,
  children,
}: {
  title: string;
  count: number;
  limit: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7 first:mt-2 sm:mt-10 sm:first:mt-4">
      <div className="mb-4 flex items-end gap-3">
        <Heading eyebrow={EYEBROW[title]}>{title}</Heading>
        <span className="pb-1 text-sm text-muted">
          {count > limit ? `${count} 件中 ${limit} 件` : `${count} 件`}
        </span>
      </div>
      {children}
    </section>
  );
}
