import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchResults } from './search-results';

export const metadata: Metadata = { title: '検索', robots: { index: false } };

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
