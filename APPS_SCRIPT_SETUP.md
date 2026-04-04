# Shared Setup

このアプリを `全員が同じデータを見て編集できる` 形にするための最小構成です。

## 1. スプレッドシートを作る

1. Google Sheets で空のスプレッドシートを1つ作る
2. 名前は任意

## 2. Apps Script を作る

1. そのスプレッドシートで `拡張機能 -> Apps Script` を開く
2. 既存の `Code.gs` を、このリポジトリの `apps-script/Code.gs` で置き換える
3. `appsscript.json` も `apps-script/appsscript.json` の内容に合わせる

補足:

- スプレッドシートに紐づいた Apps Script として作るなら `SPREADSHEET_ID` は空のままで大丈夫です
- 単独の Apps Script プロジェクトにするなら `SPREADSHEET_ID` に対象シートIDを入れてください

## 3. Web App として公開する

1. `デプロイ -> 新しいデプロイ`
2. 種類を `ウェブアプリ`
3. `次のユーザーとして実行` は `自分`
4. `アクセスできるユーザー` は `全員`
5. デプロイして `Web app URL` をコピー

## 4. フロントへ URL を設定する

`config.js` の `webAppUrl` に、コピーした URL を入れます。

```js
window.APP_CONFIG = {
  sharedStore: {
    mode: "apps-script",
    webAppUrl: "https://script.google.com/macros/s/XXXXXXXXXXXX/exec",
    pollMs: 8000,
  },
};
```

設定後に GitHub へ push すれば、GitHub Pages 側から共有保存が有効になります。

## 5. 既存データを共有側へ入れる

1. 今まで使っていたページで `書き出し`
2. 共有設定後のページで `読み込み`
3. 一度保存操作をすると、その内容が共有シートに保存されます

## 注意

- `全員` 公開にすると、URLを知っている人は全員編集できます
- 競合解決は `最後に保存した内容が勝つ` 方式です
- 画像や説明書を `ファイル添付` で大量に入れると、Apps Script / Sheets には重くなりやすいです
- 共有運用では、画像や説明書はできるだけ `URL` 登録をおすすめします
