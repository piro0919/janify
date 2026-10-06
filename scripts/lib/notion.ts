// Notion の API を叩く。トークンは .env.local の NOTION_TOKEN（kk-web と同じ連携）。
// 1秒あたり3回までの制限があるので間を空け、429 が返ったら待って打ち直す
const VERSION = "2025-09-03";
const INTERVAL_MS = 350;

// 同時に呼ばれても、送り出す時刻が INTERVAL_MS ずつずれるように枠を配る。
// 返事は1回1〜2秒かかるので、待ってから次を送ると制限の数分の一しか出ない
let nextSlot = 0;

export async function notion<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN が .env.local にありません");

  for (let attempt = 0; ; attempt++) {
    const slot = Math.max(Date.now(), nextSlot);
    nextSlot = slot + INTERVAL_MS;
    if (slot > Date.now()) await new Promise((r) => setTimeout(r, slot - Date.now()));

    const res = await fetch(`https://api.notion.com/v1${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Notion-Version": VERSION },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.ok) return res.json() as Promise<T>;
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      continue;
    }
    throw new Error(`Notion API ${res.status} ${method} ${path}: ${await res.text()}`);
  }
}

export async function queryAll<T = { id: string; properties: Record<string, any> }>(dataSourceId: string): Promise<T[]> {
  const rows: T[] = [];
  let cursor: string | undefined;
  do {
    const body = await notion<{ results: T[]; has_more: boolean; next_cursor: string }>(
      "POST",
      `/data_sources/${dataSourceId}/query`,
      { page_size: 100, start_cursor: cursor },
    );
    rows.push(...body.results);
    cursor = body.has_more ? body.next_cursor : undefined;
  } while (cursor);
  return rows;
}

export const title = (text: string) => ({ title: [{ text: { content: text.slice(0, 2000) } }] });
