import type { MetadataRoute } from 'next';
import { artists } from '@/lib/catalog';
import { SITE_URL } from '@/lib/site';

/** 一覧と、アーティスト・アルバムのページ。規約と方針のページは検索から入る先ではないので載せない */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL },
    ...artists.flatMap((artist) => [
      { url: `${SITE_URL}/artists/${artist.id}` },
      ...artist.albums.map((album) => ({ url: `${SITE_URL}/albums/${album.id}` })),
    ]),
  ];
}
