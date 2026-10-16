import type { Metadata } from 'next';
import { Heading } from '@/components/heading';
import { HistoryView } from './history-view';

// 履歴は人ごとにブラウザの中にあるので、検索には載せない
export const metadata: Metadata = { title: '履歴', robots: { index: false } };

export default function HistoryPage() {
  return (
    <>
      <div className="pt-4 pb-4 sm:pb-6">
        <Heading as="h1" size="page" eyebrow="History">
          履歴
        </Heading>
      </div>
      <HistoryView />
    </>
  );
}
