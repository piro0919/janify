import type { Metadata } from 'next';
import { LibraryContent } from './library-content';
import { Heading } from '@/components/heading';

// お気に入りは人ごとにブラウザの中にあるので、検索には載せない
export const metadata: Metadata = { title: 'ライブラリ', robots: { index: false } };

export default function LibraryPage() {
  return (
    <>
      <div className="pt-4">
        <Heading as="h1" size="page" eyebrow="Library">
          ライブラリ
        </Heading>
      </div>
      <LibraryContent />
    </>
  );
}
