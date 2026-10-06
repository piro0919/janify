'use client';

import type { ReactNode } from 'react';
import { COVER_GRID, CoverCard } from '@/components/cover-card';
import { useLibrary } from '@/components/favorites/use-library';
import { Icon } from '@/components/icon';
import { SongList } from '@/components/song-list';

export function LibraryContent() {
  const { ready, songs, albums, artists } = useLibrary();

  if (!ready) return <p className="pt-8 text-muted">読み込んでいます…</p>;
  if (songs.length + albums.length + artists.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 pt-8 text-muted">
        <p>まだお気に入りがありません。</p>
        <p className="flex items-center gap-1.5 text-sm">
          曲・アルバム・アーティストの
          <Icon name="heart" className="size-4" />
          を押すと、ここに集まります。お気に入りは、このブラウザの中にだけ保存されます。
        </p>
      </div>
    );
  }

  return (
    <>
      {songs.length > 0 && (
        <Section title="楽曲" count={songs.length}>
          <SongList songs={songs} />
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
          <div className={COVER_GRID}>
            {artists.map((a, i) => (
              <CoverCard
                key={a.id}
                eager={i < 5}
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
    </>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-6">
      <h2 className="mb-4 text-xl font-bold sm:text-2xl">
        {title}
        <span className="ml-2 text-sm font-normal text-muted">{count} 件</span>
      </h2>
      {children}
    </section>
  );
}
