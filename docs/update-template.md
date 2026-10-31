# 更新指示書：{件名}
1. 対象：Yoshi2026s/pococha-dentetsu／元 main／作業ブランチ {branch}（PR #{n} マージ済み）
2. 変更ファイル
| ファイル | 操作 | 要点 |
|---|---|---|
{rows}
3. 守ること：CRLFのまま／audio-test-results.json は入れない／表にないファイルは変えない／添付は書き換えない
4. テスト：{合否の一覧}（表示確認：{ブラウザー・画面サイズ}。未確認：{なし or 内容}）
5. コミットメッセージ：
```
{commit}
```
6. PR：タイトル「{title}」／本文は上のコミットメッセージと同じ
7. アップ後の確認（OKならマージ）：Files changed が表のファイルだけ／CRLFのまま／audio-test-results.json なし
