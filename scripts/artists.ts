// 旧ジャニーズのアーティストを集める。関連ページのリンクを候補として広く拾い、
// 1. Wikipedia に「◯◯のアルバム」か「◯◯」の分類がある
// 2. 記事が歌手・グループの基本情報欄を持ち、冒頭（最初の見出しまで）に旧ジャニーズ系の事務所かレーベルが出てくる
// ものだけを残す。ソロ歌手や退所後の活動も同じ網に掛かる
import { mkdir, writeFile } from 'node:fs/promises';
import { existingCategories, links, wikitext } from './lib/wiki';

const SOURCES = [
  'Template:ジャニーズ',
  '過去のジャニーズ所属者',
  'STARTO ENTERTAINMENT所属のタレント',
  'ジャニーズ関連OBユニット',
];

// 案内枠や一覧に載らない、退所後に組んだグループ。2 の条件も問わない
const EXTRA = ['Number i', '新しい地図', 'DOMOTO'];

// 条件はすり抜けるが、アーティストではない記事
const EXCLUDE = ['馬飼野康二'];

const JOHNNYS = /ジャニーズ|STARTO|SMILE-UP|ジェイ・ストーム|J Storm|ストームレーベルズ|Johnny's/;
const MUSICIAN = /\{\{\s*(Infobox )?Musician/i;
const COMPANY = /\{\{\s*(基礎情報 会社|Infobox (会社|Company|Record label)|レコードレーベル)/i;

// 記事名の「 (グループ)」などを外すと分類名になる（嵐 (グループ) → 嵐のアルバム）
const bare = (title: string) => title.replace(/ \([^)]*\)$/, '');

async function main() {
  const candidates = new Set<string>(EXTRA);
  for (const source of SOURCES) {
    for (const title of await links(source)) candidates.add(title);
  }
  console.error(`候補 ${candidates.size}`);

  const categoryOf = (title: string) => [
    `Category:${bare(title)}のアルバム`,
    `Category:${bare(title)}`,
  ];
  const found = await existingCategories([...candidates].flatMap(categoryOf));

  const artists: { name: string; page: string; categories: string[] }[] = [];
  for (const title of candidates) {
    if (EXCLUDE.includes(title)) continue;
    const categories = categoryOf(title).filter((c) => found.has(c));
    if (categories.length === 0) continue;

    const page = await wikitext(title);
    if (!page) continue;
    if (artists.some((a) => a.page === page.title)) continue;
    const lead = page.text.split(/\n==[^=]/)[0];
    if (!EXTRA.includes(title)) {
      // 冒頭に出てこなくても、本文で何度も触れていれば在籍していた人とみなす（田原俊彦など）
      const mentions = page.text.match(new RegExp(JOHNNYS, 'g'))?.length ?? 0;
      if (!(JOHNNYS.test(lead) || mentions >= 5) || COMPANY.test(lead)) continue;
      // 俳優の基本情報欄を使う歌手もいるので、「◯◯のアルバム」の分類があれば欄の種類は問わない
      if (!MUSICIAN.test(lead) && !categories[0].endsWith('のアルバム')) continue;
    }

    artists.push({ name: bare(page.title), page: page.title, categories });
  }
  artists.sort((a, b) => a.name.localeCompare(b.name, 'ja'));

  await mkdir('data/raw', { recursive: true });
  await writeFile('data/raw/artists.json', `${JSON.stringify(artists, null, 2)}\n`);
  console.error(`アーティスト ${artists.length} 組`);
}

main();
