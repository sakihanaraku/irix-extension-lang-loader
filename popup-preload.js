'use strict';
// 语言选择窗口的 contextBridge：只暴露读取列表 / 选择 / 关闭
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('langPicker', {
  list: () => ipcRenderer.invoke('irix-lang-loader:list'),
  ui: () => ipcRenderer.invoke('irix-lang-loader:ui'),
  pick: (file) => ipcRenderer.invoke('irix-lang-loader:pick', file),
  close: () => ipcRenderer.invoke('irix-lang-loader:close'),
});
