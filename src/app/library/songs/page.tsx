import type { Metadata } from 'next';
import { FavoriteSongs } from './favorite-songs';

// お気に入りは人ごとにブラウザの中にあるので、検索には載せない
export const metadata: Metadata = { title: 'お気に入りの曲', robots: { index: false } };

export default function FavoriteSongsPage() {
  return (
    <div className="pt-4">
      <FavoriteSongs />
    </div>
  );
}
