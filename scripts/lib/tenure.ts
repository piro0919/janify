/**
 * Notion の「アーティスト」の「ジャニーズ在籍」列を読む。人気曲の順位を、所属していた間の作品だけで
 * 数えるのに使う（src/lib/catalog.ts の inTenure）。
 * 「1971-1975」「1995-」（いまも所属）「1988-1995, 2022-2023」のように書く。
 * 「なし」は所属していた間に作品が無いもの（退所後に結成したグループなど）。空は調べていないもの
 */
export function parseTenure(value: string): { from: number; to: number | null }[] | null {
  const v = value.trim();
  if (!v) return null;
  if (v === 'なし') return [];
  return v.split(/[,、]/).map((part) => {
    const m = part.trim().match(/^(\d{4})\s*[-–〜~]\s*(\d{4})?$/);
    if (!m) throw new Error(`ジャニーズ在籍の書き方が読めない: ${value}`);
    return { from: Number(m[1]), to: m[2] ? Number(m[2]) : null };
  });
}
