# irix-extension-lang-loader

[中文](README.zh-CN.md) | [English](README.md) | **日本語**

**iRix Audio Player** の言語拡張機能です。ext-v2x の UI API を使い、`.lang` ファイルから
プレイヤー全体の表示言語を切り替えます。

- 本体：[sakihanaraku/irix-audio-player](https://github.com/sakihanaraku/irix-audio-player)
- 拡張機能ガイド：[EXTENSIONS.md](https://github.com/sakihanaraku/irix-audio-player/blob/main/EXTENSIONS.md)

## 機能

- この拡張機能の `lang/` ディレクトリにあるすべての `.lang` を読み込みます；
- 起動時、前回選択した言語、または最初の有効なファイルを自動適用します；
- コマンド **言語ファイルを選択…** で選択ウィンドウを開き、クリックですぐ切り替えます；
- 形式が違うファイルは **破損したファイル** として表示され、絶対に適用されません；
- `ctx.ui.setTexts()` で UI 文字列・フォント・`<html lang>` をまとめて適用します；
- インストールして有効な間は、プレイヤー内蔵の言語選択を無効化します（言語はこの拡張機能が管理）。

## インストール

1. このディレクトリから `.xtxs` を作成：
   ```bash
   tar -cf iRix-Extension-lang-loader-1.0.0.xtxs -C . .
   ```
2. iRix Audio Player の **設定 → 拡張機能 → 拡張機能をインストール…** で `.xtxs` を選択し、アプリを再起動；
3. **設定 → 拡張機能 → 言語ファイルを選択…** から言語を切り替え。

## `.lang` 形式（`irix-lang-v1`）

UTF-8、1 行 1 項目：

```text
# コメント
@format=irix-lang-v1
@code=ja
@name=日本語
@font="Yu Gothic UI", "Meiryo", sans-serif
@author=iRix QA
@version=1.0.0
tip.settings=設定
set.audioMode=オーディオデバイスの動作モード
```

ルール：

- `@format` は `irix-lang-v1` 固定；`@code` と `@name` は必須；`@font` / `@author` / `@version` は任意；
- それ以外は `i18nキー=値`。キーは `[A-Za-z][A-Za-z0-9._-]*`、値は空不可；
- 同じキーの重複は不可；改行は `\n`、タブは `\t`、バックスラッシュは `\\` でエスケープ；
- 最大 256 KiB、最低 1 項目；
- 形式エラー（マーカー・メタデータ・キー・重複・不正 UTF-8）が 1 つでもあれば、ファイル全体が **破損** 扱いとなり適用されません。

同梱の `lang/` には完全な `zh.lang` / `ja.lang` / `en.lang`（各 392 項目）と、
破損ファイル例の `broken.lang` が入っています。

## リポジトリ構成

```text
extension.json       マニフェスト（startup + ui + uiLanguage）
index.js             ライフサイクル、起動ロード、選択ウィンドウ、IPC
lang-format.js       厳密な .lang パーサー
popup.html           言語選択 UI
popup-preload.js     選択ウィンドウ用 contextBridge
lang/                言語パック
self-test.mjs        パーサー + 言語パックのセルフテスト
```

セルフテスト：

```bash
node self-test.mjs
```

## ライセンス

MIT — [LICENSE](LICENSE) を参照。
