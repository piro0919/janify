/** 問い合わせの窓口。Google フォーム（piro.haniwa@gmail.com の持ち物）で、回答はメールで届く */
export const CONTACT_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdyxxT4dmq7nkVL-CDh76Oye78Yvd6knPGVmbJZh-a2uYRh1g/viewform';

export const OPERATOR = 'kk-web';

export const SITE_URL = 'https://janify.kkweb.io';

/**
 * ページの正規の住所（canonical）。サイトマップに載せるページが自分の住所を名乗る。
 * レイアウトには書かない（書くと、書いていないページまで全部が同じ住所を名乗る）
 */
export function canonical(path: string): { canonical: string } {
  return { canonical: `${SITE_URL}${path}` };
}
