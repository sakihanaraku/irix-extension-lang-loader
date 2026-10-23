# irix-extension-lang-loader

**中文** | [English](README.md) | [日本語](README.ja.md)

**iRix Audio Player** 的语言扩展，通过 ext-v2x UI 接口从 `.lang` 文件切换整个界面语言。

- 主项目：[sakihanaraku/irix-audio-player](https://github.com/sakihanaraku/irix-audio-player)
- 扩展开发指南：[EXTENSIONS.md](https://github.com/sakihanaraku/irix-audio-player/blob/main/EXTENSIONS.md)

## 功能

- 读取扩展自身 `lang/` 目录下的所有 `.lang`；
- 启动时自动加载上次选择或第一个有效语言；
- 命令「选择语言文件…」打开选择窗口，点击即切换；
- 格式错误显示为 **损坏的文件**，绝不会被应用；
- 通过 `ctx.ui.setTexts()` 覆盖界面文案、字体和 `<html lang>`；
- 安装并启用后，播放器内置语言选择禁用（语言由本扩展管理）。

## 安装

1. 在本目录打 `.xtxs`：
   ```bash
   tar -cf iRix-Extension-lang-loader-1.0.0.xtxs -C . .
   ```
2. 在 iRix Audio Player：**设置 → 扩展 → 安装扩展…** 选择该 `.xtxs`，重启应用；
3. 打开 **设置 → 扩展 → 选择语言文件…** 切换语言。

## `.lang` 格式（irix-lang-v1）

UTF-8 文本，一行一条：

```text
# 注释
@format=irix-lang-v1
@code=ja
@name=日本語
@font="Yu Gothic UI", "Meiryo", sans-serif
@author=iRix QA
@version=1.0.0
tip.settings=設定
set.audioMode=オーディオデバイスの動作モード
```

规则：

- `@format` 必须是 `irix-lang-v1`；`@code`、`@name` 必填，`@font`/`@author`/`@version` 可选；
- 其余行是 `键=值`，键必须匹配 `[A-Za-z][A-Za-z0-9._-]*`，值不能为空；
- 同一键不能重复；值里换行写 `\n`、制表符写 `\t`、反斜杠写 `\\`；
- 文件最大 256 KiB，至少 1 条文案；
- 任何一条不合法（格式标记、元数据、键名、重复键、非法 UTF-8）→ 整个文件视为「损坏的文件」。

`lang/` 下自带 `zh.lang` / `ja.lang` / `en.lang` 三份完整文案（各 392 条），另有 `broken.lang` 用于验证损坏识别。

## 目录结构

```text
extension.json       清单（startup + ui + uiLanguage）
index.js             生命周期 / 启动加载 / 选择窗口 / IPC
lang-format.js       严格 .lang 解析器
popup.html           语言选择界面
popup-preload.js     选择窗口 contextBridge
lang/                语言包
self-test.mjs        解析器 + 语言包自测
```

自测：

```bash
node self-test.mjs
```

## 许可证

MIT — 见 [LICENSE](LICENSE)。
