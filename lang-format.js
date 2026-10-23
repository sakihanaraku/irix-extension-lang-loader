'use strict';

// lang-loader —— .lang 文件解析器（ext-v2x 语言扩展）
//
// 内部格式（UTF-8，行式）：
//   # 注释
//   @format=irix-lang-v1     ← 必填，格式标记
//   @code=ja                 ← 必填，写进 <html lang>
//   @name=日本語              ← 必填，选择窗口显示名
//   @font="Yu Gothic UI", sans-serif   ← 可选，覆盖界面字体
//   tip.settings=設定        ← i18n 键=值；键必须已存在于主程序
//
// 任何一项对不上（格式标记 / 元数据 / 键名 / 重复键 / 非法 UTF-8）都视为
// 「损坏的文件」，调用方不应应用其中任何一条。

const fs = require('node:fs');

const FORMAT = 'irix-lang-v1';
const MAX_BYTES = 256 * 1024;
const MAX_STRINGS = 5000;
const KEY_RE = /^[A-Za-z][A-Za-z0-9._-]{0,80}$/;
const CODE_RE = /^[a-z]{2,8}(-[A-Za-z0-9]{2,8})?$/;
const META_ALLOWED = new Set(['format', 'code', 'name', 'font', 'author', 'version']);

const ERR_CORRUPT = '损坏的文件';

function unescapeValue(raw) {
  return raw.replace(/\\(\\|n|r|t)/g, (_m, c) => (
    c === 'n' ? '\n' : c === 'r' ? '\r' : c === 't' ? '\t' : '\\'
  ));
}

/**
 * 解析 .lang 文本；失败抛错，message 一律为「损坏的文件」。
 * 成功返回 { format, code, name, font, author, version, strings }。
 */
function parseLangText(text) {
  const fail = () => { throw new Error(ERR_CORRUPT); };
  if (typeof text !== 'string') fail();
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  if (Buffer.byteLength(text, 'utf8') > MAX_BYTES) fail();

  const meta = {};
  const strings = {};
  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('@')) {
      const m = /^@([A-Za-z][A-Za-z0-9_-]*)=(.*)$/.exec(line);
      if (!m) fail();
      const key = m[1].toLowerCase();
      if (!META_ALLOWED.has(key) || Object.prototype.hasOwnProperty.call(meta, key)) fail();
      meta[key] = m[2].trim();
      continue;
    }

    const at = line.indexOf('=');
    if (at <= 0) fail();
    const key = line.slice(0, at).trim();
    const value = unescapeValue(line.slice(at + 1));
    if (!KEY_RE.test(key) || !value.trim() || Object.prototype.hasOwnProperty.call(strings, key)) fail();
    strings[key] = value;
    if (Object.keys(strings).length > MAX_STRINGS) fail();
  }

  if (meta.format !== FORMAT || !meta.code || !meta.name) fail();
  if (!CODE_RE.test(meta.code)) fail();
  if (meta.name.length > 80) fail();
  if (meta.font && meta.font.length > 200) fail();
  if (meta.author && meta.author.length > 80) fail();
  if (meta.version && meta.version.length > 40) fail();
  if (!Object.keys(strings).length) fail();

  return {
    format: meta.format,
    code: meta.code,
    name: meta.name,
    font: meta.font || '',
    author: meta.author || '',
    version: meta.version || '',
    strings,
  };
}

function parseLangFile(file) {
  let buf;
  try { buf = fs.readFileSync(file); } catch { throw new Error(ERR_CORRUPT); }
  if (buf.length > MAX_BYTES) throw new Error(ERR_CORRUPT);
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    throw new Error(ERR_CORRUPT);
  }
  return parseLangText(text);
}

module.exports = { FORMAT, ERR_CORRUPT, MAX_BYTES, parseLangText, parseLangFile };
