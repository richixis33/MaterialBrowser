const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('browserAPI', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onWindowStateChanged: (callback) => {
    ipcRenderer.on('window:state-changed', (event, data) => callback(data));
  },

  // Storage
  getBookmarks: () => ipcRenderer.invoke('storage:get-bookmarks'),
  saveBookmarks: (bookmarks) => ipcRenderer.invoke('storage:save-bookmarks', bookmarks),
  getHistory: () => ipcRenderer.invoke('storage:get-history'),
  saveHistory: (history) => ipcRenderer.invoke('storage:save-history', history),
  getSettings: () => ipcRenderer.invoke('storage:get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('storage:save-settings', settings),

  // App & Chromium info
  getInfo: () => ipcRenderer.invoke('app:get-info'),
  clearData: () => ipcRenderer.invoke('app:clear-data'),
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),

  // Downloads listener
  onDownloadStarted: (callback) => {
    ipcRenderer.on('download:started', (event, data) => callback(data));
  },
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download:progress', (event, data) => callback(data));
  },
  onDownloadDone: (callback) => {
    ipcRenderer.on('download:done', (event, data) => callback(data));
  }
});
