// Material Browser Expressive & Simple Mode - Main Application Logic
(() => {
  // DOM Elements
  const tabsList = document.getElementById('tabsList');
  const newTabBtn = document.getElementById('newTabBtn');
  const browserContent = document.getElementById('browserContent');
  const urlInput = document.getElementById('urlInput');
  const engineIcon = document.getElementById('engineIcon');
  const securityIcon = document.getElementById('securityIcon');
  const starBtn = document.getElementById('starBtn');
  const backBtn = document.getElementById('backBtn');
  const forwardBtn = document.getElementById('forwardBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const homeBtn = document.getElementById('homeBtn');
  const bookmarksBar = document.getElementById('bookmarksBar');
  const menuBtn = document.getElementById('menuBtn');
  const dropdownMenu = document.getElementById('dropdownMenu');

  // Window Controls
  const winMinBtn = document.getElementById('winMinBtn');
  const winMaxBtn = document.getElementById('winMaxBtn');
  const winCloseBtn = document.getElementById('winCloseBtn');

  // Wallpaper & Theme Studio
  const wallpaperBtn = document.getElementById('wallpaperBtn');
  const wallpaperModal = document.getElementById('wallpaperModal');
  const closeWallpaperBtn = document.getElementById('closeWallpaperBtn');
  const uploadZone = document.getElementById('uploadZone');
  const wallpaperFileInput = document.getElementById('wallpaperFileInput');
  const solidColorPicker = document.getElementById('solidColorPicker');
  const wallpaperPresetsGrid = document.getElementById('wallpaperPresetsGrid');

  // Modals & Settings
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const historyModal = document.getElementById('historyModal');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const historyList = document.getElementById('historyList');
  const themeSelect = document.getElementById('themeSelect');
  const designModeSelect = document.getElementById('designModeSelect');
  const showBookmarksToggle = document.getElementById('showBookmarksToggle');
  const settingsColorPicker = document.getElementById('settingsColorPicker');
  const openWallpaperStudioBtn = document.getElementById('openWallpaperStudioBtn');
  const searchEngineSelect = document.getElementById('searchEngineSelect');
  const clearDataBtn = document.getElementById('clearDataBtn');
  const systemInfoText = document.getElementById('systemInfoText');

  // State
  let tabs = [];
  let activeTabId = null;
  let tabCounter = 0;
  let bookmarks = [];
  let history = [];

  let settings = {
    theme: 'dark',
    designMode: 'expressive', // 'expressive' or 'simple'
    searchEngine: 'duckduckgo',
    wallpaperType: 'preset',
    wallpaperValue: 'cosmic-violet',
    accentColor: '#7F52FF',
    showBookmarksBar: true
  };

  const SEARCH_ENGINES = {
    duckduckgo: {
      name: 'DuckDuckGo',
      url: 'https://duckduckgo.com/?q=',
      icon: Icons.duckduckgo
    },
    google: {
      name: 'Google',
      url: 'https://www.google.com/search?q=',
      icon: Icons.search
    },
    bing: {
      name: 'Bing',
      url: 'https://www.bing.com/search?q=',
      icon: Icons.search
    },
    yandex: {
      name: 'Yandex',
      url: 'https://yandex.com/search/?text=',
      icon: Icons.search
    }
  };

  // Initialize Icons
  function initIcons() {
    newTabBtn.innerHTML = Icons.add;
    backBtn.innerHTML = Icons.arrowBack;
    forwardBtn.innerHTML = Icons.arrowForward;
    refreshBtn.innerHTML = Icons.refresh;
    homeBtn.innerHTML = Icons.home;
    securityIcon.innerHTML = Icons.lock;
    starBtn.innerHTML = Icons.star;
    wallpaperBtn.innerHTML = Icons.palette;
    document.getElementById('downloadsBtn').innerHTML = Icons.download;
    settingsBtn.innerHTML = Icons.settings;
    menuBtn.innerHTML = Icons.moreVert;
    winMinBtn.innerHTML = Icons.minimize;
    winMaxBtn.innerHTML = Icons.maximize;
    winCloseBtn.innerHTML = Icons.close;
    closeWallpaperBtn.innerHTML = Icons.close;
    closeSettingsBtn.innerHTML = Icons.close;
    closeHistoryBtn.innerHTML = Icons.close;
    document.getElementById('uploadIcon').innerHTML = Icons.upload;

    document.querySelectorAll('.menu-icon').forEach(el => {
      const iconName = el.getAttribute('data-icon');
      if (Icons[iconName]) el.innerHTML = Icons[iconName];
    });

    updateEngineIcon();
  }

  function updateEngineIcon() {
    const curEngine = SEARCH_ENGINES[settings.searchEngine] || SEARCH_ENGINES.duckduckgo;
    engineIcon.innerHTML = curEngine.icon;
  }

  // Load Settings and Storage
  async function initStorage() {
    if (window.browserAPI) {
      try {
        const savedSettings = await window.browserAPI.getSettings();
        if (savedSettings) {
          settings = { ...settings, ...savedSettings };
        }

        bookmarks = await window.browserAPI.getBookmarks() || [];
        renderBookmarksBar();

        history = await window.browserAPI.getHistory() || [];

        const info = await window.browserAPI.getInfo();
        if (info && systemInfoText) {
          systemInfoText.textContent = `Chromium v${info.chromiumVersion} | Electron v${info.electronVersion}`;
        }
      } catch (err) {
        console.error('Failed to load storage:', err);
      }
    }

    applyDesignMode();
    applyThemeSettings();
    renderWallpaperPresets();
  }

  // Apply Design Style Mode ('expressive' vs 'simple')
  function applyDesignMode() {
    document.documentElement.setAttribute('data-mode', settings.designMode || 'expressive');
    if (designModeSelect) designModeSelect.value = settings.designMode || 'expressive';

    if (showBookmarksToggle) {
      showBookmarksToggle.checked = settings.showBookmarksBar !== false;
    }
    if (bookmarksBar) {
      bookmarksBar.style.display = settings.showBookmarksBar !== false ? 'flex' : 'none';
    }
  }

  // Apply Theme & Extract Dynamic Colors
  async function applyThemeSettings() {
    const isDark = settings.theme === 'dark';
    document.documentElement.setAttribute('data-theme', settings.theme);

    if (themeSelect) themeSelect.value = settings.theme;
    if (searchEngineSelect) searchEngineSelect.value = settings.searchEngine;
    updateEngineIcon();

    if (settings.wallpaperType === 'color') {
      const hsl = ThemeEngine.hexToHsl(settings.wallpaperValue);
      const palette = ThemeEngine.generateM3Palette(hsl, isDark);
      ThemeEngine.applyPalette(palette);
      if (solidColorPicker) solidColorPicker.value = settings.wallpaperValue;
      if (settingsColorPicker) settingsColorPicker.value = settings.wallpaperValue;
    } else if (settings.wallpaperType === 'custom') {
      const img = new Image();
      img.onload = async () => {
        const hsl = await ThemeEngine.extractDominantColor(img);
        const palette = ThemeEngine.generateM3Palette(hsl, isDark);
        ThemeEngine.applyPalette(palette);
      };
      img.src = settings.wallpaperValue;
    } else {
      const preset = ThemeEngine.PRESET_WALLPAPERS.find(p => p.id === settings.wallpaperValue) || ThemeEngine.PRESET_WALLPAPERS[0];
      const hsl = ThemeEngine.hexToHsl(preset.baseColor);
      const palette = ThemeEngine.generateM3Palette(hsl, isDark);
      ThemeEngine.applyPalette(palette);
    }

    document.querySelectorAll('.wallpaper-layer').forEach(layer => {
      applyWallpaperToElement(layer);
    });
  }

  function applyWallpaperToElement(el) {
    if (settings.wallpaperType === 'color') {
      el.style.backgroundImage = 'none';
      el.style.backgroundColor = settings.wallpaperValue;
    } else if (settings.wallpaperType === 'custom') {
      el.style.backgroundImage = `url("${settings.wallpaperValue}")`;
      el.style.backgroundColor = 'transparent';
    } else {
      const preset = ThemeEngine.PRESET_WALLPAPERS.find(p => p.id === settings.wallpaperValue) || ThemeEngine.PRESET_WALLPAPERS[0];
      el.style.backgroundImage = preset.gradient;
      el.style.backgroundColor = 'transparent';
    }
  }

  function renderWallpaperPresets() {
    wallpaperPresetsGrid.innerHTML = '';
    ThemeEngine.PRESET_WALLPAPERS.forEach(preset => {
      const card = document.createElement('div');
      card.className = `wallpaper-card ${settings.wallpaperType === 'preset' && settings.wallpaperValue === preset.id ? 'selected' : ''}`;
      card.style.background = preset.gradient;
      card.innerHTML = `<span class="wallpaper-card-title">${preset.name}</span>`;

      card.addEventListener('click', () => {
        settings.wallpaperType = 'preset';
        settings.wallpaperValue = preset.id;
        applyThemeSettings();
        renderWallpaperPresets();
        saveSettings();
      });

      wallpaperPresetsGrid.appendChild(card);
    });
  }

  function saveSettings() {
    if (window.browserAPI) {
      window.browserAPI.saveSettings(settings);
    }
  }

  // Animated Settings Segmented Tabs
  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabKey = btn.getAttribute('data-tab');

      document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.classList.remove('active');
      });

      const targetPanel = document.getElementById(`panel${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}`);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  // Create a New Tab
  function createTab(url = 'newtab') {
    tabCounter++;
    const tabId = `tab_${tabCounter}`;
    const isNewTab = url === 'newtab' || !url;

    const tabData = {
      id: tabId,
      title: isNewTab ? 'New Tab' : 'Loading...',
      url: isNewTab ? 'newtab' : url,
      favicon: null,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      isNewTab
    };

    tabs.push(tabData);

    const tabEl = document.createElement('div');
    tabEl.className = 'tab-item';
    tabEl.id = `tab_item_${tabId}`;
    tabEl.innerHTML = `
      <div class="tab-favicon">${Icons.globe}</div>
      <span class="tab-title">${tabData.title}</span>
      <div class="tab-close-btn" title="Close tab">${Icons.close}</div>
    `;

    tabEl.addEventListener('click', (e) => {
      if (!e.target.closest('.tab-close-btn')) {
        switchTab(tabId);
      }
    });

    tabEl.querySelector('.tab-close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(tabId);
    });

    tabsList.appendChild(tabEl);

    const contentEl = document.createElement('div');
    contentEl.className = 'webview-wrapper';
    contentEl.id = `content_${tabId}`;

    if (isNewTab) {
      contentEl.innerHTML = createNewTabHtml();
      setupNewTabPageEvents(contentEl, tabId);
    } else {
      createWebview(contentEl, tabData);
    }

    browserContent.appendChild(contentEl);
    switchTab(tabId);
  }

  // Create Webview
  function createWebview(container, tabData) {
    container.innerHTML = '';
    const webview = document.createElement('webview');
    webview.setAttribute('src', tabData.url);
    webview.setAttribute('allowpopups', 'true');
    webview.setAttribute('webpreferences', 'contextIsolation=yes');

    webview.addEventListener('did-start-loading', () => {
      tabData.isLoading = true;
      updateTabLoadingState(tabData.id, true);
    });

    webview.addEventListener('did-stop-loading', () => {
      tabData.isLoading = false;
      updateTabLoadingState(tabData.id, false);
      updateTabNavigationState(tabData.id, webview);
    });

    webview.addEventListener('page-title-updated', (e) => {
      tabData.title = e.title;
      const tabEl = document.getElementById(`tab_item_${tabData.id}`);
      if (tabEl) {
        tabEl.querySelector('.tab-title').textContent = e.title;
      }
      if (activeTabId === tabData.id) {
        document.title = `${e.title} - Material Browser`;
      }
    });

    webview.addEventListener('page-favicon-updated', (e) => {
      if (e.favicons && e.favicons.length > 0) {
        tabData.favicon = e.favicons[0];
        const tabEl = document.getElementById(`tab_item_${tabData.id}`);
        if (tabEl && !tabData.isLoading) {
          tabEl.querySelector('.tab-favicon').innerHTML = `<img src="${e.favicons[0]}" onerror="this.src=''; this.parentElement.innerHTML='${Icons.globe}';">`;
        }
      }
    });

    webview.addEventListener('did-navigate', (e) => {
      tabData.url = e.url;
      tabData.isNewTab = false;
      if (activeTabId === tabData.id) {
        urlInput.value = e.url;
        updateSecurityIcon(e.url);
        updateBookmarkStar(e.url);
      }
      recordHistory(tabData.title || e.url, e.url);
    });

    webview.addEventListener('did-navigate-in-page', (e) => {
      tabData.url = e.url;
      if (activeTabId === tabData.id) {
        urlInput.value = e.url;
      }
    });

    webview.addEventListener('new-window', (e) => {
      createTab(e.url);
    });

    container.appendChild(webview);
  }

  // HTML template for New Tab Page (With App Icon & Title, No Clock or Greeting text)
  function createNewTabHtml() {
    const searchEngine = SEARCH_ENGINES[settings.searchEngine] || SEARCH_ENGINES.duckduckgo;

    return `
      <div class="newtab-page">
        <div class="wallpaper-layer"></div>
        <div class="wallpaper-overlay"></div>
        <div class="newtab-content">
          <!-- Hero Branding with Icon & Name -->
          <div class="newtab-hero-card">
            <div class="hero-logo-wrapper">
              <img src="../../assets/icon.png" alt="Material Browser" class="hero-logo" />
            </div>
            <h1 class="newtab-hero-title">Material Browser</h1>
            <p class="newtab-hero-subtitle">Fast, secure & private web browsing</p>
          </div>

          <!-- DuckDuckGo Search Capsule -->
          <div class="newtab-search-box">
            <div class="newtab-ddg-badge">
              ${searchEngine.icon}
            </div>
            <input
              type="text"
              class="newtab-search-input"
              placeholder="Search ${searchEngine.name} or type a URL"
            />
          </div>

          <!-- Bento Grid Shortcuts -->
          <div class="shortcuts-grid">
            <div class="shortcut-card" data-url="https://duckduckgo.com">
              <div class="shortcut-icon">${Icons.duckduckgo}</div>
              <div class="shortcut-title">DuckDuckGo</div>
            </div>
            <div class="shortcut-card" data-url="https://github.com">
              <div class="shortcut-icon">${Icons.globe}</div>
              <div class="shortcut-title">GitHub</div>
            </div>
            <div class="shortcut-card" data-url="https://www.youtube.com">
              <div class="shortcut-icon">${Icons.globe}</div>
              <div class="shortcut-title">YouTube</div>
            </div>
            <div class="shortcut-card" data-url="https://en.wikipedia.org">
              <div class="shortcut-icon">${Icons.globe}</div>
              <div class="shortcut-title">Wikipedia</div>
            </div>
          </div>
        </div>

        <!-- Customize Theme & Wallpaper FAB -->
        <button class="fab-customize" id="ntpCustomizeFab" title="Customize Wallpaper & Colors">
          ${Icons.palette}
          <span>Customize</span>
        </button>
      </div>
    `;
  }

  // Setup New Tab Page Events
  function setupNewTabPageEvents(container, tabId) {
    const wallpaperLayer = container.querySelector('.wallpaper-layer');
    if (wallpaperLayer) applyWallpaperToElement(wallpaperLayer);

    const searchInput = container.querySelector('.newtab-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          navigateTo(searchInput.value.trim());
        }
      });
    }

    container.querySelectorAll('.shortcut-card').forEach(card => {
      card.addEventListener('click', () => {
        const url = card.getAttribute('data-url');
        if (url) navigateTo(url);
      });
    });

    const fab = container.querySelector('#ntpCustomizeFab');
    if (fab) {
      fab.addEventListener('click', () => {
        wallpaperModal.classList.add('open');
      });
    }
  }

  // Switch Active Tab
  function switchTab(tabId) {
    activeTabId = tabId;
    const tabData = tabs.find(t => t.id === tabId);
    if (!tabData) return;

    document.querySelectorAll('.tab-item').forEach(el => {
      el.classList.toggle('active', el.id === `tab_item_${tabId}`);
    });

    document.querySelectorAll('.webview-wrapper').forEach(el => {
      el.classList.toggle('active', el.id === `content_${tabId}`);
    });

    if (tabData.isNewTab) {
      const engineName = SEARCH_ENGINES[settings.searchEngine]?.name || 'DuckDuckGo';
      urlInput.value = '';
      urlInput.placeholder = `Search ${engineName} or enter address`;
      document.title = 'New Tab - Material Browser';
      securityIcon.innerHTML = Icons.lock;
      securityIcon.classList.remove('secure');
      starBtn.classList.remove('bookmarked');
      starBtn.innerHTML = Icons.star;
    } else {
      urlInput.value = tabData.url;
      document.title = `${tabData.title} - Material Browser`;
      updateSecurityIcon(tabData.url);
      updateBookmarkStar(tabData.url);
    }

    backBtn.disabled = !tabData.canGoBack;
    forwardBtn.disabled = !tabData.canGoForward;
    updateTabLoadingState(tabId, tabData.isLoading);
  }

  // Close Tab (Bug Fix: properly stops webview before detachment)
  function closeTab(tabId) {
    const index = tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;

    const contentEl = document.getElementById(`content_${tabId}`);
    if (contentEl) {
      const webview = contentEl.querySelector('webview');
      if (webview) {
        try { webview.stop(); } catch (err) {}
      }
      contentEl.remove();
    }

    const tabEl = document.getElementById(`tab_item_${tabId}`);
    if (tabEl) tabEl.remove();

    tabs.splice(index, 1);

    if (tabs.length === 0) {
      createTab('newtab');
    } else if (activeTabId === tabId) {
      const nextIndex = Math.min(index, tabs.length - 1);
      switchTab(tabs[nextIndex].id);
    }
  }

  // Navigate Active Tab (Bug fix: enhanced URL detection)
  function navigateTo(query) {
    if (!query) return;
    const tabData = tabs.find(t => t.id === activeTabId);
    if (!tabData) return;

    let targetUrl = query.trim();

    const isUrl = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i.test(targetUrl) ||
                  /^(https?:\/\/)?localhost(:\d+)?(\/.*)?$/i.test(targetUrl) ||
                  /^(https?:\/\/)?\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/.*)?$/.test(targetUrl);

    if (isUrl) {
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }
    } else {
      const curEngine = SEARCH_ENGINES[settings.searchEngine] || SEARCH_ENGINES.duckduckgo;
      targetUrl = curEngine.url + encodeURIComponent(targetUrl);
    }

    tabData.url = targetUrl;
    tabData.isNewTab = false;

    const contentEl = document.getElementById(`content_${tabData.id}`);
    if (contentEl) {
      let webview = contentEl.querySelector('webview');
      if (!webview) {
        createWebview(contentEl, tabData);
      } else {
        webview.loadURL(targetUrl);
      }
    }

    urlInput.value = targetUrl;
    updateSecurityIcon(targetUrl);
  }

  // Update Security Icon
  function updateSecurityIcon(url) {
    if (url && url.startsWith('https://')) {
      securityIcon.innerHTML = Icons.lock;
      securityIcon.classList.add('secure');
    } else {
      securityIcon.innerHTML = Icons.lockOpen;
      securityIcon.classList.remove('secure');
    }
  }

  // Update Loading State (Shape-Morphing Loader)
  function updateTabLoadingState(tabId, isLoading) {
    const tabEl = document.getElementById(`tab_item_${tabId}`);
    const tabData = tabs.find(t => t.id === tabId);

    if (tabEl && tabData) {
      const favEl = tabEl.querySelector('.tab-favicon');
      if (isLoading) {
        favEl.innerHTML = Icons.shapeMorphSpinner(16);
      } else {
        if (tabData.favicon) {
          favEl.innerHTML = `<img src="${tabData.favicon}" onerror="this.src=''; this.parentElement.innerHTML='${Icons.globe}';">`;
        } else {
          favEl.innerHTML = Icons.globe;
        }
      }
    }

    if (activeTabId === tabId) {
      refreshBtn.innerHTML = isLoading ? Icons.close : Icons.refresh;
    }
  }

  // Navigation State
  function updateTabNavigationState(tabId, webview) {
    const tabData = tabs.find(t => t.id === tabId);
    if (tabData && webview) {
      tabData.canGoBack = webview.canGoBack();
      tabData.canGoForward = webview.canGoForward();
      if (activeTabId === tabId) {
        backBtn.disabled = !tabData.canGoBack;
        forwardBtn.disabled = !tabData.canGoForward;
      }
    }
  }

  // History Recording
  async function recordHistory(title, url) {
    if (!url || url === 'newtab' || url.startsWith('chrome://')) return;
    const item = {
      title: title || url,
      url,
      timestamp: Date.now()
    };
    history.unshift(item);
    if (history.length > 500) history.pop();
    if (window.browserAPI) {
      window.browserAPI.saveHistory(history);
    }
  }

  // Bookmarks Bar
  function renderBookmarksBar() {
    bookmarksBar.innerHTML = '';
    bookmarks.forEach(bm => {
      const chip = document.createElement('div');
      chip.className = 'bookmark-chip';
      chip.innerHTML = `${Icons.globe} <span>${bm.title}</span>`;
      chip.addEventListener('click', () => navigateTo(bm.url));
      bookmarksBar.appendChild(chip);
    });
  }

  function toggleBookmark() {
    const tabData = tabs.find(t => t.id === activeTabId);
    if (!tabData || tabData.isNewTab) return;

    const existingIndex = bookmarks.findIndex(b => b.url === tabData.url);
    if (existingIndex >= 0) {
      bookmarks.splice(existingIndex, 1);
      starBtn.classList.remove('bookmarked');
      starBtn.innerHTML = Icons.star;
    } else {
      bookmarks.push({
        id: `bm_${Date.now()}`,
        title: tabData.title || tabData.url,
        url: tabData.url
      });
      starBtn.classList.add('bookmarked');
      starBtn.innerHTML = Icons.starFilled;
    }

    renderBookmarksBar();
    if (window.browserAPI) {
      window.browserAPI.saveBookmarks(bookmarks);
    }
  }

  function updateBookmarkStar(url) {
    const isBookmarked = bookmarks.some(b => b.url === url);
    starBtn.classList.toggle('bookmarked', isBookmarked);
    starBtn.innerHTML = isBookmarked ? Icons.starFilled : Icons.star;
  }

  // History Modal
  function renderHistoryModal() {
    historyList.innerHTML = '';
    if (history.length === 0) {
      historyList.innerHTML = '<div style="color: var(--md-on-surface-variant); text-align: center; padding: 20px;">No history recorded yet</div>';
      return;
    }

    history.forEach(item => {
      const row = document.createElement('div');
      row.className = 'setting-item';
      row.style.cursor = 'pointer';
      const dateStr = new Date(item.timestamp).toLocaleTimeString();
      row.innerHTML = `
        <div class="setting-label">
          <span class="setting-title">${item.title}</span>
          <span class="setting-subtitle">${item.url} - ${dateStr}</span>
        </div>
      `;
      row.addEventListener('click', () => {
        historyModal.classList.remove('open');
        navigateTo(item.url);
      });
      historyList.appendChild(row);
    });
  }

  // Wallpaper Upload Handling
  function handleWallpaperFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      settings.wallpaperType = 'custom';
      settings.wallpaperValue = dataUrl;
      applyThemeSettings();
      renderWallpaperPresets();
      saveSettings();
    };
    reader.readAsDataURL(file);
  }

  // Event Listeners
  newTabBtn.addEventListener('click', () => createTab('newtab'));

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      navigateTo(urlInput.value);
      urlInput.blur();
    }
  });

  urlInput.addEventListener('focus', () => urlInput.select());
  starBtn.addEventListener('click', toggleBookmark);

  backBtn.addEventListener('click', () => {
    const contentEl = document.getElementById(`content_${activeTabId}`);
    const webview = contentEl ? contentEl.querySelector('webview') : null;
    if (webview && webview.canGoBack()) webview.goBack();
  });

  forwardBtn.addEventListener('click', () => {
    const contentEl = document.getElementById(`content_${activeTabId}`);
    const webview = contentEl ? contentEl.querySelector('webview') : null;
    if (webview && webview.canGoForward()) webview.goForward();
  });

  refreshBtn.addEventListener('click', () => {
    const tabData = tabs.find(t => t.id === activeTabId);
    if (!tabData) return;
    const contentEl = document.getElementById(`content_${activeTabId}`);
    const webview = contentEl ? contentEl.querySelector('webview') : null;
    if (webview) {
      if (tabData.isLoading) webview.stop();
      else webview.reload();
    }
  });

  homeBtn.addEventListener('click', () => {
    const contentEl = document.getElementById(`content_${activeTabId}`);
    const tabData = tabs.find(t => t.id === activeTabId);
    if (tabData && contentEl) {
      tabData.isNewTab = true;
      tabData.url = 'newtab';
      tabData.title = 'New Tab';
      contentEl.innerHTML = createNewTabHtml();
      setupNewTabPageEvents(contentEl, tabData.id);
      switchTab(tabData.id);
    }
  });

  // Window Controls IPC
  winMinBtn.addEventListener('click', () => window.browserAPI && window.browserAPI.minimize());
  winMaxBtn.addEventListener('click', async () => {
    if (window.browserAPI) {
      const isMax = await window.browserAPI.maximize();
      winMaxBtn.innerHTML = isMax ? Icons.restore : Icons.maximize;
    }
  });
  winCloseBtn.addEventListener('click', () => window.browserAPI && window.browserAPI.close());

  if (window.browserAPI) {
    window.browserAPI.onWindowStateChanged(({ isMaximized }) => {
      winMaxBtn.innerHTML = isMaximized ? Icons.restore : Icons.maximize;
    });
  }

  // Modals & Menu
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('open');
  });

  document.addEventListener('click', () => dropdownMenu.classList.remove('open'));

  wallpaperBtn.addEventListener('click', () => wallpaperModal.classList.add('open'));
  closeWallpaperBtn.addEventListener('click', () => wallpaperModal.classList.remove('open'));

  settingsBtn.addEventListener('click', () => settingsModal.classList.add('open'));
  closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('open'));

  openWallpaperStudioBtn.addEventListener('click', () => {
    settingsModal.classList.remove('open');
    wallpaperModal.classList.add('open');
  });

  document.getElementById('menuNewTab').addEventListener('click', () => createTab('newtab'));
  document.getElementById('menuWallpaper').addEventListener('click', () => wallpaperModal.classList.add('open'));
  document.getElementById('menuSettings').addEventListener('click', () => settingsModal.classList.add('open'));
  document.getElementById('menuHistory').addEventListener('click', () => {
    renderHistoryModal();
    historyModal.classList.add('open');
  });
  closeHistoryBtn.addEventListener('click', () => historyModal.classList.remove('open'));

  document.getElementById('menuDevTools').addEventListener('click', () => {
    const contentEl = document.getElementById(`content_${activeTabId}`);
    const webview = contentEl ? contentEl.querySelector('webview') : null;
    if (webview) webview.openDevTools();
  });

  // Wallpaper Upload Zone
  uploadZone.addEventListener('click', () => wallpaperFileInput.click());
  wallpaperFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleWallpaperFile(e.target.files[0]);
    }
  });

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--md-primary)';
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.style.borderColor = 'var(--md-outline)';
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--md-outline)';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleWallpaperFile(e.dataTransfer.files[0]);
    }
  });

  // Solid Color Pickers
  solidColorPicker.addEventListener('input', (e) => {
    settings.wallpaperType = 'color';
    settings.wallpaperValue = e.target.value;
    applyThemeSettings();
    renderWallpaperPresets();
    saveSettings();
  });

  settingsColorPicker.addEventListener('input', (e) => {
    settings.wallpaperType = 'color';
    settings.wallpaperValue = e.target.value;
    applyThemeSettings();
    renderWallpaperPresets();
    saveSettings();
  });

  // Design Mode Switcher
  designModeSelect.addEventListener('change', (e) => {
    settings.designMode = e.target.value;
    applyDesignMode();
    saveSettings();
  });

  // Bookmarks Toggle
  showBookmarksToggle.addEventListener('change', (e) => {
    settings.showBookmarksBar = e.target.checked;
    bookmarksBar.style.display = e.target.checked ? 'flex' : 'none';
    saveSettings();
  });

  // Theme Select
  themeSelect.addEventListener('change', (e) => {
    settings.theme = e.target.value;
    applyThemeSettings();
    saveSettings();
  });

  searchEngineSelect.addEventListener('change', (e) => {
    settings.searchEngine = e.target.value;
    updateEngineIcon();
    saveSettings();
  });

  clearDataBtn.addEventListener('click', async () => {
    if (window.browserAPI) {
      clearDataBtn.textContent = 'Clearing...';
      await window.browserAPI.clearData();
      history = [];
      clearDataBtn.textContent = 'Cleared!';
      setTimeout(() => clearDataBtn.textContent = 'Clear Now', 1500);
    }
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 't') {
      e.preventDefault();
      createTab('newtab');
    } else if (e.ctrlKey && e.key.toLowerCase() === 'w') {
      e.preventDefault();
      if (activeTabId) closeTab(activeTabId);
    } else if (e.ctrlKey && (e.key.toLowerCase() === 'l' || e.key.toLowerCase() === 'e')) {
      e.preventDefault();
      urlInput.focus();
      urlInput.select();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      renderHistoryModal();
      historyModal.classList.add('open');
    } else if (e.key === 'Escape') {
      settingsModal.classList.remove('open');
      wallpaperModal.classList.remove('open');
      historyModal.classList.remove('open');
      dropdownMenu.classList.remove('open');
    }
  });

  // Initialize
  initIcons();
  initStorage();
  createTab('newtab');
})();
