# ポコチャ電鉄 作業ルール（Claude 用）
共通のルール（出力・トークン削減・承認・開発・スマホ検証）は Yoshi の共通カスタム指示に従う。ここにはこのリポジトリ固有の決まりだけを書く。

## 言語
- コミット・PR・更新指示書・コマンドの説明文は日本語で書く。

## ファイルの扱い
- `index.html`・`online.js` は CRLF のまま保つ。編集後に `file index.html online.js` で確認する。
- `audio-test-results.json` と、テストで書き換わった `package-lock.json`・結果JSONはコミットしない（コミット前に `git status --short` で確認して戻す）。
- 依頼にないファイルは変更しない。

## テスト（push 前に全部合格を確認する）
- 初回だけ `npm install` を実行する。
- 必須：test-dom / test-regressions / test-pause / test-audio。ほかに、変更に関係するテストと、新しく追加したテストも実行する。
- まとめて実行し、合否だけ表示する（ログはファイルに保存し、不合格のときだけ見る）：
  ```bash
  for t in test-dom test-regressions test-pause test-audio; do printf "$t: "; node $t.cjs > /tmp/$t.log 2>&1 && echo OK || { echo NG; tail -5 /tmp/$t.log; }; done
  ```
- 通信（部屋・手番の同期・`firestore.rules`・`online.js`）を変えたときだけ、`npm run test:online` と `npm run test:online-e2e` も実行する（Java が必要。本番のデータは使わない）。

## 更新の流れ
1. `main` の最新から作業ブランチを作る。
2. 変更 → テスト合格 → コミット → push → PR 作成 → **マージ**（ユーザーの確認を待たない。マージ方法は merge commit）。
   - マージ前の確認は手元で行う：`git diff --stat origin/main...HEAD`（依頼のファイルだけか）、`file`（CRLF か）、`audio-test-results.json` が含まれていないか。GitHub から PR の差分全文は取らない。
   - CI はないので、手元のテスト合格をマージの条件にする。不合格または競合があるときはマージせず報告する。
3. 公開版（https://yoshi2026s.github.io/pococha-dentetsu/）の反映は、`curl -s` と `grep -c 変更の目印` で確認する（待つときは繰り返しの1コマンドで）。
4. `docs/update-template.md` の `{…}` だけを埋めて ChatGPT 用の更新指示書を1ファイル作り、変更ファイルの zip と一緒にユーザーへ渡す（記録用。ユーザーは ChatGPT でも GitHub `Yoshi2026s/pococha-dentetsu` へアップする）。
