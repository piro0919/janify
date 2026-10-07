# Janify

旧ジャニーズ事務所に所属していたアーティストの曲を、アルバムごとに聴ける音楽プレイヤー風のサイトです。

https://janify.kkweb.io/

- 音源はすべて YouTube の埋め込みです。音声や動画のファイルは持ちません
- 曲目は Wikipedia の公開情報をもとに作り、動画は YouTube Data API で探しています
- お気に入りは曲・アルバム・アーティストの3つで、ブラウザの中にだけ保存します

## 動かす

```bash
pnpm install
pnpm dev
```

http://localhost:3000 で開けます。サイトは `src/data/catalog.json` だけを読むので、環境変数は要りません。

## 検査

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm knip
pnpm test       # Vitest
pnpm test:e2e   # Playwright。本番のビルドを立ち上げて、パソコンとスマホの幅で確かめる
```

コミットのときに lefthook が整形・lint・型・秘密情報の検査を回します。GitHub Actions では、main への push とプルリクエストで同じ検査・ビルド・E2E を回します。

掲載中の動画がまだ流せるかは、毎週月曜に Actions が確かめます。流せない動画があると失敗してメールが届きます。手元で見るときは次のとおりです。

```bash
pnpm youtube:check
```

## データ

正本は Notion の「アーティスト」「アルバム」「曲」の3つのデータベースです。ビルドからは Notion を叩かず、書き出した JSON をコミットします。

```bash
pnpm notion:export                       # Notion → src/data/catalog.json
pnpm notion:videos && pnpm notion:export  # 見つかった非公式の動画を Notion に入れてから書き出す
pnpm youtube:icons                       # アーティストのチャンネルのアイコンを Notion に入れる
```

`scripts/` を動かすには `.env.local` に次の2つが要ります。

| 名前              | 中身                                |
| ----------------- | ----------------------------------- |
| `NOTION_TOKEN`    | Notion の連携のトークン             |
| `YOUTUBE_API_KEY` | Janify 用の YouTube Data API のキー |

最初の一式の作り方、YouTube の規約で縛られていること、決めたことの経緯は [CLAUDE.md](CLAUDE.md) にまとめています。

## 使っているもの

Next.js（App Router）・Tailwind CSS・YouTube IFrame Player API・Vercel
