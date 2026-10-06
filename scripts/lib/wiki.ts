// 日本語版 Wikipedia の API を叩く。User-Agent を付けないと弾かれ、続けて叩くと 429 が返るので間を空ける
const API = 'https://ja.wikipedia.org/w/api.php';
const USER_AGENT = 'Janify/0.1 (https://github.com/piro0919/janify)';
const INTERVAL_MS = 300;

let last = 0;

async function call(params: Record<string, string>): Promise<unknown> {
  const wait = last + INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  last = Date.now();

  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (res.ok) return res.json();
    if (attempt >= 3) throw new Error(`${res.status} ${url}`);
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
  }
}

export async function wikitext(title: string): Promise<{ title: string; text: string } | null> {
  const data = (await call({ action: 'parse', page: title, prop: 'wikitext', redirects: '1' })) as {
    parse?: { title: string; wikitext: string };
  };
  return data.parse ? { title: data.parse.title, text: data.parse.wikitext } : null;
}

export async function links(title: string): Promise<string[]> {
  const data = (await call({ action: 'parse', page: title, prop: 'links', redirects: '1' })) as {
    parse?: { links: { ns: number; title: string; exists: boolean }[] };
  };
  return (data.parse?.links ?? []).filter((l) => l.ns === 0 && l.exists).map((l) => l.title);
}

/** 存在するカテゴリだけを、ページ数つきで返す */
export async function existingCategories(titles: string[]): Promise<Map<string, number>> {
  const found = new Map<string, number>();
  for (let i = 0; i < titles.length; i += 50) {
    const data = (await call({
      action: 'query',
      prop: 'categoryinfo',
      titles: titles.slice(i, i + 50).join('|'),
    })) as {
      query: { pages: { title: string; missing?: boolean; categoryinfo?: { pages: number } }[] };
    };
    for (const p of data.query.pages) {
      if (!p.missing && p.categoryinfo && p.categoryinfo.pages > 0)
        found.set(p.title, p.categoryinfo.pages);
    }
  }
  return found;
}

/** 記事ごとの分類。テンプレート経由で付いた分類も含む */
export async function categoriesOf(titles: string[]): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  for (let i = 0; i < titles.length; i += 50) {
    let cont: Record<string, string> = {};
    do {
      const data = (await call({
        action: 'query',
        prop: 'categories',
        cllimit: 'max',
        titles: titles.slice(i, i + 50).join('|'),
        ...cont,
      })) as {
        query: { pages: { title: string; categories?: { title: string }[] }[] };
        continue?: Record<string, string>;
      };
      for (const p of data.query.pages) {
        result.set(p.title, [
          ...(result.get(p.title) ?? []),
          ...(p.categories ?? []).map((c) => c.title),
        ]);
      }
      cont = data.continue ?? {};
    } while (Object.keys(cont).length > 0);
  }
  return result;
}

export async function categoryMembers(category: string): Promise<string[]> {
  const data = (await call({
    action: 'query',
    list: 'categorymembers',
    cmtitle: category,
    cmnamespace: '0',
    cmlimit: '500',
  })) as { query: { categorymembers: { title: string }[] } };
  return data.query.categorymembers.map((m) => m.title);
}
