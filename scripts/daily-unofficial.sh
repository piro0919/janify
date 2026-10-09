#!/bin/zsh
# 非公式の動画の検索を、その日の枠の分だけ進める。Owler のジョブ janify-unofficial（launchd の io.kkweb.owler.job.janify-unofficial）が
# 毎日17時半に呼ぶ。YouTube の検索枠は太平洋時間の0時（日本時間の16〜17時）に戻る
cd /Users/piro/Repository/janify || exit 1
echo "=== $(date '+%Y-%m-%d %H:%M')"
/Users/piro/.volta/bin/pnpm youtube:unofficial
