const { app, BrowserWindow, ipcMain, session, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

// Paths for persistent data
const userDataPath = app.getPath('userData');
const bookmarksFile = path.join(userDataPath, 'bookmarks.json');
const historyFile = path.join(userDataPath, 'history.json');
const settingsFile = path.join(userDataPath, 'settings.json');

// Helper to safely read JSON
function readJSON(filePath, defaultVal = []) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultVal;
}

// Helper to safely write JSON
function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Frameless for custom Material 3 titlebar
    backgroundColor: '#141218',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      spellcheck: true
    }
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('maximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:state-changed', { isMaximized: true });
    }
  });

  mainWindow.on('unmaximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:state-changed', { isMaximized: false });
    }
  });

  // Track downloads
  session.defaultSession.on('will-download', (event, item) => {
    const filename = item.getFilename();
    const totalBytes = item.getTotalBytes();

    mainWindow.webContents.send('download:started', { filename, totalBytes });

    item.on('updated', (evt, state) => {
      if (state === 'interrupted') {
        mainWindow.webContents.send('download:interrupted', { filename });
      } else if (state === 'progressing') {
        mainWindow.webContents.send('download:progress', {
          filename,
          receivedBytes: item.getReceivedBytes(),
          totalBytes
        });
      }
    });

    item.once('done', (evt, state) => {
      mainWindow.webContents.send('download:done', {
        filename,
        state,
        path: item.getSavePath()
      });
    });
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Window Controls
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
    return mainWindow.isMaximized();
  }
  return false;
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Storage Bookmarks
ipcMain.handle('storage:get-bookmarks', () => {
  return readJSON(bookmarksFile, [
    { title: 'DuckDuckGo', url: 'https://duckduckgo.com', id: 'bm_1' },
    { title: 'GitHub', url: 'https://github.com', id: 'bm_2' },
    { title: 'YouTube', url: 'https://www.youtube.com', id: 'bm_3' },
    { title: 'Wikipedia', url: 'https://en.wikipedia.org', id: 'bm_4' }
  ]);
});

ipcMain.handle('storage:save-bookmarks', (event, bookmarks) => {
  writeJSON(bookmarksFile, bookmarks);
  return true;
});

// Storage History
ipcMain.handle('storage:get-history', () => {
  return readJSON(historyFile, []);
});

ipcMain.handle('storage:save-history', (event, history) => {
  writeJSON(historyFile, history);
  return true;
});

// Storage Settings (Default to DuckDuckGo and Cosmic Violet wallpaper)
ipcMain.handle('storage:get-settings', () => {
  return readJSON(settingsFile, {
    theme: 'dark',
    searchEngine: 'duckduckgo',
    wallpaperType: 'preset',
    wallpaperValue: 'cosmic-violet',
    accentColor: '#7F52FF',
    showBookmarksBar: true
  });
});

ipcMain.handle('storage:save-settings', (event, settings) => {
  writeJSON(settingsFile, settings);
  return true;
});

// App & Chromium Info
ipcMain.handle('app:get-info', () => {
  return {
    version: app.getVersion(),
    chromiumVersion: process.versions.chrome,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    platform: process.platform,
    arch: process.arch
  };
});

// Clear Data
ipcMain.handle('app:clear-data', async () => {
  try {
    await session.defaultSession.clearCache();
    await session.defaultSession.clearStorageData();
    writeJSON(historyFile, []);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Shell External
ipcMain.handle('shell:open-external', async (event, url) => {
  return shell.openExternal(url);
});
