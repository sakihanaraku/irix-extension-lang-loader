# irix-extension-lang-loader

[中文](README.zh-CN.md) | **English** | [日本語](README.ja.md)

Language extension for **iRix Audio Player** — switches the whole UI language from `.lang` files
using the ext-v2x UI API.

- Main project: [sakihanaraku/irix-audio-player](https://github.com/sakihanaraku/irix-audio-player)
- Extension guide: [EXTENSIONS.md](https://github.com/sakihanaraku/irix-audio-player/blob/main/EXTENSIONS.md)

## Features

- Reads every `.lang` file from this extension's `lang/` directory;
- At startup, loads the last selected language, or the first valid one;
- Command **Choose language file…** opens a picker; clicking a language applies it immediately;
- Malformed files are shown as **corrupted file** and are never applied;
- Applies UI strings, font family and `<html lang>` through `ctx.ui.setTexts()`;
- When installed and enabled, the player's built-in language selector is disabled (language is managed here).

## Install

1. Build the `.xtxs` package from this directory:
   ```bash
   tar -cf iRix-Extension-lang-loader-1.0.0.xtxs -C . .
   ```
2. In iRix Audio Player: **Settings → Extensions → Install extension…**, choose the `.xtxs`, restart the app.
3. Open **Settings → Extensions → Choose language file…** to switch languages.

## `.lang` format (`irix-lang-v1`)

UTF-8, one entry per line:

```text
# comment
@format=irix-lang-v1
@code=ja
@name=日本語
@font="Yu Gothic UI", "Meiryo", sans-serif
@author=iRix QA
@version=1.0.0
tip.settings=設定
set.audioMode=オーディオデバイスの動作モード
```

Rules:

- `@format` must be `irix-lang-v1`; `@code` and `@name` are required; `@font` / `@author` / `@version` are optional;
- All other lines are `i18n-key=value`; keys must match `[A-Za-z][A-Za-z0-9._-]*` and values cannot be empty;
- Duplicate keys are rejected; escape newlines as `\n`, tabs as `\t`, backslashes as `\\`;
- Maximum 256 KiB, at least one string;
- Any format error (format marker, metadata, key, duplicate, invalid UTF-8) makes the whole file **corrupted** and it is not applied.

The bundled `lang/` contains complete `zh.lang` / `ja.lang` / `en.lang` packs (392 strings each)
and `broken.lang` as a corrupted-file example.

## Repository layout

```text
extension.json       manifest (startup + ui + uiLanguage)
index.js             lifecycle, startup load, picker window, IPC
lang-format.js       strict .lang parser
popup.html           language picker UI
popup-preload.js     contextBridge for the picker
lang/                language packs
self-test.mjs        parser + language-pack self-test
```

Run the self-test:

```bash
node self-test.mjs
```

## License

MIT — see [LICENSE](LICENSE).
