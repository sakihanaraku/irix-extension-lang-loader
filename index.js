'use strict';

// lang-loader —— ext-v2x 语言扩展
//
// - 扩展目录的 lang/*.lang 是语言文件；启动时自动加载「上次选择」或第一个有效文件
// - 命令「选择语言文件…」打开选择窗口，列出全部 .lang；无效文件显示「损坏的文件」
// - 通过 ext-v2x 的 ctx.ui.setTexts({ strings, font, language }) 覆盖界面文案与字体
//
// 注意：本插件不修改主程序设置，只维护自己目录下的 selected.json。

const fs = require('node:fs');
const path = require('node:path');
const { parseLangFile, ERR_CORRUPT } = require('./lang-format');

const IPC = {
  list: 'irix-lang-loader:list',
  pick: 'irix-lang-loader:pick',
  close: 'irix-lang-loader:close',
  ui: 'irix-lang-loader:ui',
};

let ctxRef = null;
let win = null;
let ipcBound = false;
let electronRef = null;
let activeLang = null;

function getElectron() {
  if (electronRef) return electronRef;
  try {
    const e = require('electron');
    if (e && e.BrowserWindow && e.ipcMain) electronRef = e;
  } catch { /* Node 单测没有 Electron */ }
  return electronRef;
}

function langDir() {
  return path.join(ctxRef.extension.dir, 'lang');
}

function selectedFile() {
  return path.join(ctxRef.extension.dir, 'selected.json');
}

function readSelected() {
  try {
    const j = JSON.parse(fs.readFileSync(selectedFile(), 'utf8'));
    return typeof j.file === 'string' ? j.file : '';
  } catch { return ''; }
}

function writeSelected(file) {
  try {
    fs.writeFileSync(selectedFile(), JSON.stringify({ file }, null, 2), 'utf8');
  } catch (err) {
    ctxRef.log('保存选择失败：', err && err.message);
  }
}

/** 列出 lang/*.lang（无效文件也返回，交给 UI 标记为损坏） */
function listLanguages() {
  let names = [];
  try { names = fs.readdirSync(langDir()); } catch { return []; }
  return names
    .filter((n) => /\.lang$/i.test(n) && !n.startsWith('.'))
    .sort((a, b) => a.localeCompare(b, 'en'))
    .map((file) => {
      const full = path.join(langDir(), file);
      try {
        const lang = parseLangFile(full);
        return { file, valid: true, code: lang.code, name: lang.name, error: '' };
      } catch {
        return { file, valid: false, code: '', name: file, error: ERR_CORRUPT };
      }
    });
}

function applyLanguage(lang) {
  if (!ctxRef) return;
  activeLang = lang;
  ctxRef.ui.setTexts({
    strings: lang.strings,
    font: lang.font,
    language: lang.code,
  });
  ctxRef.log(`已加载语言：${lang.name} (${lang.code})，${Object.keys(lang.strings).length} 条`);
}

/** 插件自身的界面文案：来自当前 .lang 的 ext.lang-loader.* 键，缺失时回退中文 */
function pickupUi() {
  const strings = (activeLang && activeLang.strings) || {};
  const pick = (key, fallback) => (typeof strings[key] === 'string' ? strings[key] : fallback);
  return {
    title: pick('ext.lang-loader.popup.title', '选择语言文件'),
    hint: pick('ext.lang-loader.popup.hint', '读取扩展的 lang/*.lang；格式不对的文件会显示为「损坏的文件」。'),
    close: pick('ext.lang-loader.popup.close', '关闭'),
    current: pick('ext.lang-loader.popup.current', '当前'),
    noFiles: pick('ext.lang-loader.popup.noFiles', 'lang 目录里没有 .lang 文件'),
  };
}

/** 启动时加载：优先上次选择，否则第一个有效文件 */
function loadInitial() {
  const list = listLanguages();
  const saved = readSelected();
  const savedItem = saved ? list.find((x) => x.file === saved && x.valid) : null;
  const item = savedItem || list.find((x) => x.valid);
  if (!item) {
    ctxRef.log('lang 目录里没有有效 .lang 文件');
    return null;
  }
  try {
    const lang = parseLangFile(path.join(langDir(), item.file));
    applyLanguage(lang);
    if (saved !== item.file) writeSelected(item.file);
    return item.file;
  } catch {
    ctxRef.log(`默认语言文件损坏：${item.file}`);
    return null;
  }
}

function ensureIpc() {
  if (ipcBound) return true;
  const e = getElectron();
  if (!e) return false;
  e.ipcMain.handle(IPC.list, () => {
    const items = listLanguages();
    const selected = readSelected();
    return items.map((x) => ({ ...x, selected: x.file === selected }));
  });
  e.ipcMain.handle(IPC.ui, () => pickupUi());
  e.ipcMain.handle(IPC.pick, (_event, file) => {
    if (typeof file !== 'string' || !/^[^\\/:*?"<>|]+\.lang$/i.test(file)) {
      return { ok: false, error: ERR_CORRUPT };
    }
    const full = path.join(langDir(), file);
    let lang;
    try { lang = parseLangFile(full); } catch { return { ok: false, error: ERR_CORRUPT }; }
    applyLanguage(lang);
    writeSelected(file);
    closePicker();
    return { ok: true, name: lang.name };
  });
  e.ipcMain.handle(IPC.close, () => { closePicker(); return true; });
  ipcBound = true;
  return true;
}

function removeIpc() {
  const e = getElectron();
  if (!ipcBound || !e) return;
  for (const ch of Object.values(IPC)) {
    try { e.ipcMain.removeHandler(ch); } catch { /* ignore */ }
  }
  ipcBound = false;
}

function closePicker() {
  if (win && !win.isDestroyed()) {
    try { win.close(); } catch { /* ignore */ }
  }
  win = null;
}

function openPicker() {
  const e = getElectron();
  if (!e) throw new Error('当前环境没有 Electron，无法打开选择窗口');
  if (!ensureIpc()) throw new Error('无法初始化选择窗口');
  if (win && !win.isDestroyed()) {
    win.show();
    win.focus();
    return;
  }
  const parent = e.BrowserWindow.getFocusedWindow() || undefined;
  const ui = pickupUi();
  win = new e.BrowserWindow({
    width: 460,
    height: 560,
    minWidth: 360,
    minHeight: 360,
    parent,
    modal: false,
    show: false,
    title: ui.title,
    webPreferences: {
      preload: path.join(__dirname, 'popup-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.once('ready-to-show', () => { if (win && !win.isDestroyed()) win.show(); });
  win.on('closed', () => { win = null; });
  win.loadFile(path.join(__dirname, 'popup.html'));
}

function activate(ctx) {
  ctxRef = ctx;
  loadInitial();
}

function deactivate() {
  closePicker();
  removeIpc();
  try { if (ctxRef) ctxRef.ui.clear(); } catch { /* ignore */ }
  ctxRef = null;
}

module.exports = {
  id: 'lang-loader',
  activate,
  deactivate,
  commands: {
    choose: () => {
      openPicker();
      return '已打开语言选择窗口';
    },
  },
  // 给单测/调试用的纯函数
  __test: { parseLangFile, listLanguages, loadInitial, applyLanguage, pickupUi },
};
