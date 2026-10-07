// アーティストのチャンネルのアイコンを YouTube Data API から取り、Notion の「アーティスト」の「アイコン」列に書く。
// チャンネルは scripts/channels.json（アーティスト名 → チャンネルの id の並び）。
// Topic のチャンネルを先に使う。公式のチャンネルのアイコンはグループのロゴが多く、Topic のほうが顔写真のことが多い
// （DOMOTO・V6・SUPER EIGHT・錦戸亮など）。Topic が複数あれば、後ろ（新しい名義を後ろに並べてある）を先に見る。
// 公式のチャンネルにはレーベルのもの（Storm Labels）も混じるので、そのアイコンは使わない。
// 「アイコン」列に手で入れた値は上書きしない（`--overwrite` を付けたときだけ書き直す）。書いたら `pnpm notion:export` で catalog.json に出す。
// API は channels.list を50件ずつ。検索の枠は使わない（1回1単位）
import { readFile } from 'node:fs/promises';
import { notion, queryAll } from './lib/notion';
import { youtube } from './lib/youtube';

type Channel = {
  id: string;
  snippet: {
    title: string;
    thumbnails: Record<'default' | 'medium' | 'high', { url: string } | undefined>;
  };
};

const COLUMN = 'アイコン';
/** Topic のアイコンが YouTube の初期のもの（人の形や頭文字）のアーティスト。公式のチャンネルのアイコンを使う */
const OFFICIAL_FIRST = new Set(['7ORDER']);
/** どのチャンネルのアイコンも使えないアーティスト。名前の頭の1字を出す */
const NO_ICON = new Set(['タッキー&翼']);
/** アーティストのものではないチャンネル */
const NOT_ARTIST = /Storm Labels/;

async function main() {
  const channels = JSON.parse(await readFile('scripts/channels.json', 'utf8')) as Record<
    string,
    string[]
  >;
  const ids = JSON.parse(await readFile('scripts/notion-ids.json', 'utf8')) as { artists: string };

  const all = [...new Set(Object.values(channels).flat())];
  const found = new Map<string, Channel>();
  for (let i = 0; i < all.length; i += 50) {
    const body = await youtube<{ items?: Channel[] }>('channels', {
      part: 'snippet',
      id: all.slice(i, i + 50).join(','),
      maxResults: '50',
    });
    for (const c of body.items ?? []) found.set(c.id, c);
  }

  const iconOf = (name: string): string | null => {
    if (NO_ICON.has(name)) return null;
    const list = (channels[name] ?? [])
      .flatMap((id) => found.get(id) ?? [])
      .filter((c) => !NOT_ARTIST.test(c.snippet.title));
    const topic = list.filter((c) => c.snippet.title.endsWith('- Topic')).toReversed();
    const official = list.filter((c) => !c.snippet.title.endsWith('- Topic'));
    const pick = (OFFICIAL_FIRST.has(name) ? [...official, ...topic] : [...topic, ...official])[0];
    const t = pick?.snippet.thumbnails;
    return t?.high?.url ?? t?.medium?.url ?? t?.default?.url ?? null;
  };

  // 列が無ければ足す（URL の型）
  await notion('PATCH', `/data_sources/${ids.artists}`, { properties: { [COLUMN]: { url: {} } } });

  const rows = await queryAll(ids.artists);
  let written = 0;
  for (const row of rows) {
    const name = (row.properties['名前']?.title ?? [])
      .map((t: { plain_text: string }) => t.plain_text)
      .join('');
    if (row.properties[COLUMN]?.url && !process.argv.includes('--overwrite')) continue;
    const icon = iconOf(name);
    if (!icon) {
      console.error(`アイコンなし: ${name}`);
      // 書き直すときは、前に入れた値を消す
      if (row.properties[COLUMN]?.url) {
        await notion('PATCH', `/pages/${row.id}`, { properties: { [COLUMN]: { url: null } } });
      }
      continue;
    }
    await notion('PATCH', `/pages/${row.id}`, { properties: { [COLUMN]: { url: icon } } });
    written++;
  }
  console.error(`アイコンを ${written} 組に書いた`);
}

main();
