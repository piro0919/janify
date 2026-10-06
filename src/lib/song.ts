// 曲名の表記ゆれを潰す。全角半角・大小・記号・空白の違いを無視する
export const norm = (s: string) =>
  s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\-‐–—~〜～・･!！?？.,、。'’"“”`*★☆♪♡＆&:：;/／()（）「」『』【】[\]|｜#]/g, '');

/** 末尾の (Album ver.) のような注記を外した曲名。同じ曲かどうかの判定と検索に使う */
export const bareTitle = (s: string) =>
  s.replace(/\s*[（(［\[][^（）()［］\[\]]*[）)］\]]\s*$/, '').trim();

/** ベスト盤などに何度も出てくる同じ曲を、1つにまとめるための鍵 */
export const songKey = (artist: string, track: string) => `${artist}:${norm(bareTitle(track))}`;
