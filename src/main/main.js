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
    frame: false, // Frameless for custom Material Design titlebar
    backgroundColor: '#1E1E2E',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true, // Enables <webview> for multi-tab rendering
      spellcheck: true
    }
  });

  // Remove default menu bar
  Menu.setApplicationMenu(null);

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window maximize/unmaximize state for renderer titlebar buttons
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

  // Setup download tracking
  session.defaultSession.on('will-download', (event, item, webContents) => {
    const filename = item.getFilename();
    const totalBytes = item.getTotalBytes();

    mainWindow.webContents.send('download:started', {
      filename,
      totalBytes
    });

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

// App lifecycle
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

// IPC Window Controls
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

// IPC Bookmarks
ipcMain.handle('storage:get-bookmarks', () => {
  return readJSON(bookmarksFile, [
    { title: 'Google', url: 'https://www.google.com', id: 'bm_1' },
    { title: 'GitHub', url: 'https://github.com', id: 'bm_2' },
    { title: 'YouTube', url: 'https://www.youtube.com', id: 'bm_3' },
    { title: 'Wikipedia', url: 'https://en.wikipedia.org', id: 'bm_4' }
  ]);
});

ipcMain.handle('storage:save-bookmarks', (event, bookmarks) => {
  writeJSON(bookmarksFile, bookmarks);
  return true;
});

// IPC History
ipcMain.handle('storage:get-history', () => {
  return readJSON(historyFile, []);
});

ipcMain.handle('storage:save-history', (event, history) => {
  writeJSON(historyFile, history);
  return true;
});

// IPC Settings
ipcMain.handle('storage:get-settings', () => {
  return readJSON(settingsFile, {
    theme: 'system',
    accentColor: 'indigo',
    searchEngine: 'google',
    homePage: 'newtab',
    showBookmarksBar: true
  });
});

ipcMain.handle('storage:save-settings', (event, settings) => {
  writeJSON(settingsFile, settings);
  return true;
});

// IPC System / Chromium Info
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

// IPC Clear Browsing Data
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

// Open external link in default browser if needed
ipcMain.handle('shell:open-external', async (event, url) => {
  return shell.openExternal(url);
});
