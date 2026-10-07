'use client';

import type { ReactNode } from 'react';
import { ARTIST_GRID, COVER_GRID, CoverCard } from '@/components/cover-card';
import Link from 'next/link';
import { useLibraryKept } from '@/components/favorites/use-library';
import { SongList } from '@/components/song-list';
import { Heading } from '@/components/heading';

/** 見出しの上に添える小さな英字 */
const EYEBROW: Record<string, string> = {
  楽曲: 'Songs',
  アルバム: 'Albums',
  アーティスト: 'Artists',
};

export function LibraryContent() {
  const { ready, songs, albums, artists } = useLibraryKept();

  if (!ready) return <p className="pt-8 text-muted">読み込んでいます…</p>;
  if (songs.length + albums.length + artists.length === 0) {
    return <p className="pt-8 text-muted">まだお気に入りがありません。</p>;
  }

  return (
    <>
      {songs.length > 0 && (
        <Section title="楽曲" count={songs.length} href="/library/songs">
          {/* 出し入れと並べ替えは、すべて表示の先（お気に入りの曲の画面）でする */}
          <SongList songs={songs.slice(0, 10)} favorites={songs} hearts={false} />
        </Section>
      )}
      {albums.length > 0 && (
        <Section title="アルバム" count={albums.length}>
          <div className={COVER_GRID}>
            {albums.map((a, i) => (
              <CoverCard
                key={a.id}
                eager={i < 5}
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
      {artists.length > 0 && (
        <Section title="アーティスト" count={artists.length}>
          <div className={ARTIST_GRID}>
            {artists.map((a, i) => (
              <CoverCard
                key={a.id}
                eager={i < 5}
                href={`/artists/${a.id}`}
                playing={{ artistId: a.id }}
                cover={a.cover}
                round
                title={a.name}
                sub={`アルバム ${a.albums} 枚`}
              />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

function Section({
  title,
  count,
  href,
  children,
}: {
  title: string;
  count: number;
  /** すべて表示の行き先 */
  href?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-6">
      <div className="mb-4 flex items-end gap-3">
        <Heading eyebrow={EYEBROW[title]}>{title}</Heading>
        <span className="pb-1 text-sm text-muted">{count} 件</span>
        {href && (
          <Link
            href={href}
            className="ml-auto rounded-full border border-line/60 bg-sidebar/60 px-3 py-1 text-xs font-bold text-foreground transition-colors hover:bg-sidebar/90"
          >
            すべて表示
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
