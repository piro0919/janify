'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { COVER_GRID, CoverCard } from '@/components/cover-card';
import { SongList } from '@/components/song-list';
import { search, type SearchIndex } from '@/lib/search';

let loading: Promise<SearchIndex> | undefined;
const loadIndex = () =>
  (loading ??= fetch('/search-index').then((r) => r.json() as Promise<SearchIndex>));

/** 出しすぎると一覧が長くなるので、種類ごとに上限を設ける */
const LIMIT = { artists: 10, albums: 20, songs: 50 };

export function SearchResults() {
  const query = useSearchParams().get('q') ?? '';
  const [index, setIndex] = useState<SearchIndex | null>(null);

  useEffect(() => {
    void loadIndex().then(setIndex);
  }, []);

  const result = useMemo(() => (index ? search(index, query) : null), [index, query]);

  if (!query.trim()) {
    return <p className="pt-8 text-muted">曲名・アルバム名・アーティスト名で探せます。</p>;
  }
  if (!index) return <p className="pt-8 text-muted">読み込んでいます…</p>;
  if (!result || (!result.artists.length && !result.albums.length && !result.songs.length)) {
    return <p className="pt-8 text-muted">「{query}」に当てはまるものはありませんでした。</p>;
  }

  return (
    <div className="pt-4">
      {result.songs.length > 0 && (
        <Section title="楽曲" count={result.songs.length} limit={LIMIT.songs}>
          <SongList songs={result.songs.slice(0, LIMIT.songs)} />
        </Section>
      )}
      {result.artists.length > 0 && (
        <Section title="アーティスト" count={result.artists.length} limit={LIMIT.artists}>
          <div className={COVER_GRID}>
            {result.artists.slice(0, LIMIT.artists).map((a) => (
              <CoverCard
                key={a.id}
                href={`/artists/${a.id}`}
                playing={{ artistId: a.id }}
                cover={a.cover}
                title={a.name}
                sub={`アルバム ${a.albums} 枚`}
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
    <section className="mt-10 first:mt-4">
      <h2 className="mb-4 text-xl font-bold">
        {title}
        <span className="ml-2 text-sm font-normal text-muted">
          {count > limit ? `${count} 件中 ${limit} 件` : `${count} 件`}
        </span>
      </h2>
      {children}
    </section>
  );
}
