@AGENTS.md

# Janify

旧ジャニーズ事務所に所属していたアーティストの曲を、アルバムごとに聴ける音楽プレイヤー風のサイト。公開先は https://janify.kkweb.io/ 。
2026-10-06〜07 に壁打ちで合意し、同じセッションで手元で動くところまで作った。

## 現在地（2026-10-07）

- 手元で動く。`pnpm dev` で一覧・アルバム・再生の3画面。曲の終わりで次の曲へ進むこと、スマホ幅で崩れないことは実物で確かめた
- `src/data/catalog.json` は Notion から書き出した版。アーティスト41組・アルバム396枚・再生できる曲4760曲
  - 内訳: Topic の公式音源 4313・公式の MV 186・非公式の動画 261
- 非公式の動画の検索が、この Mac の launchd で毎日17時半に回っている（後述）。全部を一巡するのに36日ほど
- 2026-10-07 に公開した。GitHub は piro0919/janify の main、Vercel につないで janify.kkweb.io で配信している
  - Vercel に環境変数は無い。`.env.local` のトークンは `scripts/` だけが使う
  - kkweb.io は別の Vercel アカウントに紐づいていて、サブドメインを足すたびに `_vercel` の TXT が要る。Cloudflare の DNS は `.env.local` の `CLOUDFLARE_API_TOKEN`（kkweb.io の DNS 編集のみ）で API から足せる

## 残りの作業（上から順に）

1. 本人に画面を触ってもらい、直したい点を聞く
2. 「ジャニーズ」と Spotify の「〜ify」の商標を確かめる。公開前の宿題だったが、確かめないまま公開した
3. YouTube Data API の検索の上限を増やす申請を出す（本人が出すと決めた）
   - 申請には、公開済みの URL・プライバシーポリシー・利用規約のページが要る。ページはまだ無い
   - お問い合わせの窓口は Google フォーム（piro.haniwa@gmail.com の持ち物）。回答が来るとメールで届く。サイトにはまだリンクしていない
     - 回答用: https://docs.google.com/forms/d/e/1FAIpQLSdyxxT4dmq7nkVL-CDh76Oye78Yvd6knPGVmbJZh-a2uYRh1g/viewform
     - 編集用: https://docs.google.com/forms/d/1mpwA-1ttj88JwtYG3NwJXN0I0q08RS1EX9rodfwgGhA/edit
     - X のアカウントを出さないためにフォームにした。koidamashii の「自前のフォーム→DB→毎朝 Issue」は、Janify のリポジトリが公開で DB も無いので見送った
   - フォーム: https://support.google.com/youtube/contact/yt_api_form
4. 非公式の検索が進んだら、定期的に Notion へ反映して書き出す:

   ```bash
   pnpm notion:videos && pnpm notion:export
   ```

## 決めたこと

- 音源は YouTube の埋め込みだけ。音声ファイルは持たない
- 対象は旧ジャニーズ事務所に所属していたアーティスト全体。ソロ歌手と、退所後の活動も拾える範囲で含める。全網羅にはこだわらない
- 再生は、再生・一時停止・前後の曲送りと、アルバムを順に続けて再生するところまで。シャッフル・リピート・再生リストは入れていない
- メンバーの顔が見えることを優先する。一覧は YouTube のサムネイル（MV を優先）、再生画面は MV か、Topic の音源ならジャケット
- 動画が全尺の MV と Topic の音源の両方にあるときは MV。MV がショート版なら Topic の音源
- 公式の音源が無い曲は、非公式の動画で埋める。全アーティストが対象（本人の判断）
  - 著作権法のリーチサイト規制（113条2項）に近づくおそれは伝えたうえで、本人がこう決めた。削除の依頼が来たら Notion の「掲載」を外して書き出し直せば下げられる
- 名前は本人の案「ジャニファイ」。「ジャニーズ」をそのまま名前に入れない（商標）

### 仮決め（本人に確かめていない）

- 動画の無い曲も曲目に灰色で残し、押せないようにした
- 再生できる曲が1曲も無いアルバムとアーティストは一覧に出さない

## YouTube の規約で縛られていること

- プレイヤーの上や手前に何も重ねない。動画をぼかして背景に敷き、その上に操作部を載せる作りは使えない
- プレイヤーは 200×200 ピクセル以上
- サムネイルは加工せずに出す
- YouTube を自動の手段で読まない。Playwright などで検索結果を読むのは利用規約違反。動画は Data API から取る
- 1つのアプリに1つの API プロジェクト。Janify 用のプロジェクト（Google Cloud の「Janify」）のキーを使う。ほかのアプリのキーを借りない

## データの流れ

正本は Notion（私物のワークスペースの「Janify」ページの下にある「アーティスト」「アルバム」「曲」）。
サイトが読むのは `src/data/catalog.json` だけで、ビルドから Notion は叩かない。
曲名の誤りや動画の差し替えは Notion の「曲」で直し、書き出してコミットする:

```bash
pnpm notion:export
```

Notion の「曲」の「動画」列は MV・音源・非公式の3つ。「YouTube」列に入っている行は、`notion:videos` が上書きしない（手で直した値を守る）。

最初の一式は次の順で作った。作り直すことは基本的に無い。

1. `pnpm wiki:artists` — Wikipedia の関連ページのリンクから候補を拾い、「◯◯のアルバム」か「◯◯」の分類があり、旧ジャニーズ系の事務所に触れている記事だけ残す
2. `pnpm wiki:albums` — 分類からアルバムの記事を集め、曲目を読む。曲目表の書式と番号付きの箇条書きの二通り
3. `pnpm youtube:videos` — `scripts/channels.json` で選んだ公式チャンネルと Topic チャンネルの投稿一覧を取る
4. `pnpm youtube:match` — 曲と動画を突き合わせる
5. `pnpm notion:import` → `pnpm notion:videos` — Notion へ入れる

中間データは `data/raw/` に置き、コミットしない。`data/raw/notion-progress.json`（取り込みのときに作った行と鍵の対応）は `notion:videos` が使うので消さない。

## 非公式の動画の検索

- `pnpm youtube:unofficial` が、公式で当たらなかった曲を1曲ずつ「アーティスト名 曲名」で検索し、`data/raw/unofficial.json` に足す
- 検索は1回100単位で、無料枠は1日100回ほど。多くのアルバムに入っている曲から先に検索する。当たる割合は7割ほど
- launchd の `~/Library/LaunchAgents/io.kkweb.janify.unofficial.plist` が、毎日17時半に `scripts/daily-unofficial.sh` を呼ぶ。記録は `data/raw/unofficial.log`
  - 検索の枠は太平洋時間の0時（日本時間の16〜17時）に戻る
  - 止めるとき: `launchctl unload ~/Library/LaunchAgents/io.kkweb.janify.unofficial.plist`
- アルバム単位の検索（1回で1枚分）は試したが、アルバムの紹介動画ばかり返って当たらなかった。非公式の動画は個人のチャンネルにばらばらに上がっていて、チャンネルを丸ごと取る方式も使えない

## 落とし穴

- Topic チャンネル（YouTube がレコード会社の音源から自動で作るチャンネル）にアルバム曲が全尺の公式音源で上がっている。投稿一覧が無い Topic チャンネルもあり、そのときは再生リストを辿る
- 配信されていないアーティスト（SMAP・少年隊・TOKIO・光GENJI の大半など）は公式の音源が無い。非公式の検索でだけ埋まる
- 公式チャンネルには「MV鑑賞会」「MV preview」のような企画動画が多い。MV の判定から弾く語は `scripts/match.ts` の `NOT_MV`
- 検索の枠切れは 403 `quotaExceeded` のほか、429 `Quota exceeded` でも返ってくる
- Wikipedia の年の分類は「2024年のアルバム」だけでなく「2021年のデビュー・アルバム」もある。年の分類が無いアルバムもあるので、基本情報欄の発売日でも拾う
- 新しい地図は Wikipedia にアルバムの分類が無く拾えていない。足すなら Notion に手で入れる
- Notion の API は1秒3回まで。返事が1〜2秒かかるので、待ってから次を送ると上限の数分の一しか出ない。`scripts/lib/notion.ts` は送る時刻の枠を配って並べて送る
- `pnpm-workspace.yaml` の `minimumReleaseAge`（3日待ち）に、create-next-app が入れた新しすぎる版が引っかかった。lockfile を消して作り直すと、すべて3日以上たった版で解決する
- トークン: `NOTION_TOKEN` は kk-web と同じ連携（kk-web portfolio export。Janify ページにつないである）。`YOUTUBE_API_KEY` は Janify 用。どちらも `.env.local`
