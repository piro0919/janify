import { z } from 'zod';

/**
 * scripts/ が読む鍵。どれも .env.local に置き、Vercel には置かない（サイトは使わない）。
 * スクリプトごとに要る鍵が違うので、使う時点で1つずつ確かめる
 */
const SCHEMA = {
  // Notion の連携の鍵。kk-web と同じ連携（kk-web portfolio export）で、Janify のページにつないである
  NOTION_TOKEN: z.string().min(1),
  // YouTube Data API の鍵。Google Cloud の「Janify」のプロジェクトのもの。ほかのアプリの鍵を借りない
  YOUTUBE_API_KEY: z.string().min(1),
} as const;

export function scriptEnv(name: keyof typeof SCHEMA): string {
  const result = SCHEMA[name].safeParse(process.env[name]);
  if (!result.success) throw new Error(`${name} が .env.local にありません`);
  return result.data;
}
