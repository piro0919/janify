import { scriptEnv } from './env';

// Notion の API を叩く。トークンは .env.local の NOTION_TOKEN（kk-web と同じ連携）。
// 1秒あたり3回までの制限があるので間を空け、429 が返ったら待って打ち直す
const VERSION = '2025-09-03';
const INTERVAL_MS = 350;

// 同時に呼ばれても、送り出す時刻が INTERVAL_MS ずつずれるように枠を配る。
// 返事は1回1〜2秒かかるので、待ってから次を送ると制限の数分の一しか出ない
let nextSlot = 0;

export async function notion<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = scriptEnv('NOTION_TOKEN');

  for (let attempt = 0; ; attempt++) {
    const slot = Math.max(Date.now(), nextSlot);
    nextSlot = slot + INTERVAL_MS;
    if (slot > Date.now()) await new Promise((r) => setTimeout(r, slot - Date.now()));

    const res = await fetch(`https://api.notion.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': VERSION,
      },
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

// 1回の問い合わせで辿れるのは1万件まで。それを超えると has_more が false になり、黙って途切れる
// （2026-10-09、曲が12,799行になって、書き出しからアルバムが127枚消えた）
const QUERY_LIMIT = 10000;

/**
 * 全行を読む。作られた順に並べ、1万件に届いたら最後の行の作成時刻から問い合わせ直す。
 * 作成時刻は分の単位なので、境目の行は二重に返る。id で除く
 */
export async function queryAll<
  T extends { id: string } = { id: string; properties: Record<string, any> },
>(dataSourceId: string): Promise<T[]> {
  const rows = new Map<string, T>();
  let after: string | undefined;
  for (;;) {
    let cursor: string | undefined;
    let count = 0;
    let last: string | undefined;
    do {
      const body = await notion<{
        results: (T & { created_time: string })[];
        has_more: boolean;
        next_cursor: string;
      }>('POST', `/data_sources/${dataSourceId}/query`, {
        page_size: 100,
        start_cursor: cursor,
        sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
        ...(after && {
          filter: { timestamp: 'created_time', created_time: { on_or_after: after } },
        }),
      });
      for (const row of body.results) rows.set(row.id, row);
      count += body.results.length;
      last = body.results.at(-1)?.created_time ?? last;
      cursor = body.has_more ? body.next_cursor : undefined;
    } while (cursor);
    if (count < QUERY_LIMIT || !last || last === after) return [...rows.values()];
    after = last;
  }
}

export const title = (text: string) => ({ title: [{ text: { content: text.slice(0, 2000) } }] });
