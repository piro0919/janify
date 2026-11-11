import { scriptEnv } from './env';

// YouTube Data API を叩く。キーは .env.local の YOUTUBE_API_KEY（Google Cloud の「Janify」のプロジェクトのもの）。
// 上限は1日12万単位（うち search.list は10万、2026-11-10 に承認。CLAUDE.md の「YouTube Data API の上限」）。
// 動画は投稿一覧（50本で1単位）から取る。YouTube の規約上、API 以外でページを機械的に読まない
const API = 'https://www.googleapis.com/youtube/v3';

// 500 backendError のような向こうの一時的な不調は、少し待ってやり直す（2026-11-11 に検索の途中で止まった）
const RETRIES = 3;
const RETRY_WAIT_MS = 5000;

export async function youtube<T = any>(path: string, params: Record<string, string>): Promise<T> {
  const key = scriptEnv('YOUTUBE_API_KEY');
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API}/${path}?${new URLSearchParams({ ...params, key })}`);
    if (res.ok) return res.json() as Promise<T>;
    if (res.status >= 500 && attempt < RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_WAIT_MS * (attempt + 1)));
      continue;
    }
    throw new Error(`YouTube API ${res.status} ${path}: ${await res.text()}`);
  }
}
