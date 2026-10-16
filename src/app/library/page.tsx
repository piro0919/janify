import type { Metadata } from 'next';
import Link from 'next/link';
import { LibraryContent } from './library-content';
import { Heading } from '@/components/heading';

// お気に入りは人ごとにブラウザの中にあるので、検索には載せない
export const metadata: Metadata = { title: 'ライブラリ', robots: { index: false } };

export default function LibraryPage() {
  return (
    <>
      <div className="flex items-end gap-3 pt-4">
        <Heading as="h1" size="page" eyebrow="Library">
          ライブラリ
        </Heading>
        {/* 視聴履歴への入口。お気に入りとは別の画面にする（お気に入りの先頭に、自分で選んでいない曲が来ないように） */}
        <Link
          href="/library/history"
          className="mb-1 ml-auto rounded-full border border-line/60 bg-sidebar/60 px-3 py-1 text-xs font-bold text-foreground transition-colors hover:bg-sidebar/90"
        >
          履歴
        </Link>
      </div>
      <LibraryContent />
    </>
  );
}
