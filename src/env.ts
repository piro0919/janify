import { createEnv } from '@t3-oss/env-nextjs';

/**
 * サイトが読む環境変数の検査。next.config.ts が読み込むので、欠けていればビルドの頭で止まる。
 *
 * いまのサイトは環境変数を1つも読まない（Vercel にも置いていない）。ログインを入れるときに、
 * DATABASE_URL・BETTER_AUTH_SECRET・GOOGLE_CLIENT_ID・GOOGLE_CLIENT_SECRET をここに足し、
 * `export const env` にして使う（koidamashii の src/env.ts と同じ形）。
 * scripts/ の鍵（Notion・YouTube）は手元でしか使わないので、ここではなく scripts/lib/env.ts で確かめる
 */
createEnv({
  server: {},
  client: {},
  runtimeEnv: {},
  emptyStringAsUndefined: true,
});
