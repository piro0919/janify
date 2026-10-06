// YouTube Data API を叩く。キーは .env.local の YOUTUBE_API_KEY（tune-link と同じ）。
// 無料枠は1日1万単位。検索は1回100単位と重いので、チャンネルを探すときだけ使い、
// 動画は投稿一覧（50本で1単位）から取る。YouTube の規約上、API 以外でページを機械的に読まない
const API = "https://www.googleapis.com/youtube/v3";

export async function youtube<T = any>(path: string, params: Record<string, string>): Promise<T> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY が .env.local にありません");
  const res = await fetch(`${API}/${path}?${new URLSearchParams({ ...params, key })}`);
  if (!res.ok) throw new Error(`YouTube API ${res.status} ${path}: ${await res.text()}`);
  return res.json() as Promise<T>;
}
