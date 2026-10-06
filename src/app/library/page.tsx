import type { Metadata } from 'next';
import { LibraryContent } from './library-content';

// お気に入りは人ごとにブラウザの中にあるので、検索には載せない
export const metadata: Metadata = { title: 'ライブラリ', robots: { index: false } };

export default function LibraryPage() {
  return (
    <>
      <h1 className="pt-4 text-3xl font-bold">ライブラリ</h1>
      <LibraryContent />
    </>
  );
}
