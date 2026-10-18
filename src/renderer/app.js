// Material Browser - Main Renderer Application Logic
(() => {
  // DOM Elements
  const tabsList = document.getElementById('tabsList');
  const newTabBtn = document.getElementById('newTabBtn');
  const browserContent = document.getElementById('browserContent');
  const urlInput = document.getElementById('urlInput');
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

  // Modals & Settings
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const historyModal = document.getElementById('historyModal');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const historyList = document.getElementById('historyList');
  const themeSelect = document.getElementById('themeSelect');
  const accentPicker = document.getElementById('accentPicker');
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
    accentColor: 'indigo',
    searchEngine: 'google'
  };

  const SEARCH_ENGINES = {
    google: 'https://www.google.com/search?q=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    bing: 'https://www.bing.com/search?q=',
    yandex: 'https://yandex.com/search/?text='
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
    document.getElementById('downloadsBtn').innerHTML = Icons.download;
    settingsBtn.innerHTML = Icons.settings;
    menuBtn.innerHTML = Icons.moreVert;
    winMinBtn.innerHTML = Icons.minimize;
    winMaxBtn.innerHTML = Icons.maximize;
    winCloseBtn.innerHTML = Icons.close;
    closeSettingsBtn.innerHTML = Icons.close;
    closeHistoryBtn.innerHTML = Icons.close;

    // Menu icons
    document.querySelectorAll('.menu-icon').forEach(el => {
      const iconName = el.getAttribute('data-icon');
      if (Icons[iconName]) el.innerHTML = Icons[iconName];
    });
  }

  // Load Settings and Storage from Electron main process
  async function initStorage() {
    if (window.browserAPI) {
      try {
        const savedSettings = await window.browserAPI.getSettings();
        if (savedSettings) {
          settings = { ...settings, ...savedSettings };
          applySettings();
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
  }

  // Apply Theme and Accent
  function applySettings() {
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.setAttribute('data-accent', settings.accentColor);
    if (themeSelect) themeSelect.value = settings.theme;
    if (searchEngineSelect) searchEngineSelect.value = settings.searchEngine;

    // Highlight selected accent circle
    document.querySelectorAll('.accent-circle').forEach(circle => {
      if (circle.getAttribute('data-accent') === settings.accentColor) {
        circle.classList.add('selected');
      } else {
        circle.classList.remove('selected');
      }
    });
  }

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

    // Create Tab DOM item in Strip
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

    // Create Tab Content Wrapper
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

  // Create Webview instance inside content wrapper
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
        if (tabEl) {
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

    // Handle target="_blank" to open in new tab
    webview.addEventListener('new-window', (e) => {
      createTab(e.url);
    });

    container.appendChild(webview);
  }

  // HTML template for Material 3 New Tab Page
  function createNewTabHtml() {
    const hours = new Date().getHours();
    let greeting = 'Good morning';
    if (hours >= 12 && hours < 17) greeting = 'Good afternoon';
    else if (hours >= 17 || hours < 5) greeting = 'Good evening';

    return `
      <div class="newtab-page">
        <div class="newtab-clock" id="ntpClock">12:00</div>
        <div class="newtab-greeting">${greeting}</div>
        <div class="newtab-search-box">
          ${Icons.search}
          <input type="text" class="newtab-search-input" placeholder="Search Google or enter address" />
        </div>
        <div class="shortcuts-grid">
          <div class="shortcut-card" data-url="https://www.google.com">
            <div class="shortcut-icon">${Icons.globe}</div>
            <div class="shortcut-title">Google</div>
          </div>
          <div class="shortcut-card" data-url="https://www.youtube.com">
            <div class="shortcut-icon">${Icons.globe}</div>
            <div class="shortcut-title">YouTube</div>
          </div>
          <div class="shortcut-card" data-url="https://github.com">
            <div class="shortcut-icon">${Icons.globe}</div>
            <div class="shortcut-title">GitHub</div>
          </div>
          <div class="shortcut-card" data-url="https://en.wikipedia.org">
            <div class="shortcut-icon">${Icons.globe}</div>
            <div class="shortcut-title">Wikipedia</div>
          </div>
        </div>
      </div>
    `;
  }

  // Setup Clock and Event handlers on New Tab Page
  function setupNewTabPageEvents(container, tabId) {
    const clockEl = container.querySelector('#ntpClock');
    const updateClock = () => {
      const now = new Date();
      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    };
    updateClock();
    setInterval(updateClock, 1000);

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
  }

  // Switch Active Tab
  function switchTab(tabId) {
    activeTabId = tabId;
    const tabData = tabs.find(t => t.id === tabId);
    if (!tabData) return;

    // Update Tab strip classes
    document.querySelectorAll('.tab-item').forEach(el => {
      el.classList.toggle('active', el.id === `tab_item_${tabId}`);
    });

    // Update Content wrapper visibility
    document.querySelectorAll('.webview-wrapper').forEach(el => {
      el.classList.toggle('active', el.id === `content_${tabId}`);
    });

    // Update Omnibox URL
    if (tabData.isNewTab) {
      urlInput.value = '';
      urlInput.placeholder = 'Search Google or enter address';
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

    // Update Nav buttons
    backBtn.disabled = !tabData.canGoBack;
    forwardBtn.disabled = !tabData.canGoForward;
    refreshBtn.innerHTML = tabData.isLoading ? Icons.close : Icons.refresh;
  }

  // Close Tab
  function closeTab(tabId) {
    const index = tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;

    // Remove DOM elements
    const tabEl = document.getElementById(`tab_item_${tabId}`);
    if (tabEl) tabEl.remove();

    const contentEl = document.getElementById(`content_${tabId}`);
    if (contentEl) contentEl.remove();

    tabs.splice(index, 1);

    if (tabs.length === 0) {
      createTab('newtab');
    } else if (activeTabId === tabId) {
      const nextIndex = Math.min(index, tabs.length - 1);
      switchTab(tabs[nextIndex].id);
    }
  }

  // Navigate Active Tab to URL or Search
  function navigateTo(query) {
    if (!query) return;
    const tabData = tabs.find(t => t.id === activeTabId);
    if (!tabData) return;

    let targetUrl = query.trim();

    // Check if it's a URL or search query
    const isUrl = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/.test(targetUrl) ||
                  /^localhost(:\d+)?(\/.*)?$/.test(targetUrl);

    if (isUrl) {
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }
    } else {
      const enginePrefix = SEARCH_ENGINES[settings.searchEngine] || SEARCH_ENGINES.google;
      targetUrl = enginePrefix + encodeURIComponent(targetUrl);
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

  // Update Security Icon (Lock / Open lock)
  function updateSecurityIcon(url) {
    if (url.startsWith('https://')) {
      securityIcon.innerHTML = Icons.lock;
      securityIcon.classList.add('secure');
    } else {
      securityIcon.innerHTML = Icons.lockOpen;
      securityIcon.classList.remove('secure');
    }
  }

  // Update Tab Loading State
  function updateTabLoadingState(tabId, isLoading) {
    if (activeTabId === tabId) {
      refreshBtn.innerHTML = isLoading ? Icons.close : Icons.refresh;
    }
  }

  // Update Navigation State (canGoBack / canGoForward)
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

  // Bookmarks Bar Rendering
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

  // Toggle Bookmark for current page
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

  // Render History in Modal
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

  document.addEventListener('click', () => {
    dropdownMenu.classList.remove('open');
  });

  settingsBtn.addEventListener('click', () => settingsModal.classList.add('open'));
  closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('open'));

  document.getElementById('menuNewTab').addEventListener('click', () => createTab('newtab'));
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

  // Theme & Accent Switcher
  themeSelect.addEventListener('change', (e) => {
    settings.theme = e.target.value;
    applySettings();
    if (window.browserAPI) window.browserAPI.saveSettings(settings);
  });

  accentPicker.addEventListener('click', (e) => {
    const circle = e.target.closest('.accent-circle');
    if (circle) {
      settings.accentColor = circle.getAttribute('data-accent');
      applySettings();
      if (window.browserAPI) window.browserAPI.saveSettings(settings);
    }
  });

  searchEngineSelect.addEventListener('change', (e) => {
    settings.searchEngine = e.target.value;
    if (window.browserAPI) window.browserAPI.saveSettings(settings);
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

  // Global Keyboard Shortcuts
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
      historyModal.classList.remove('open');
      dropdownMenu.classList.remove('open');
    }
  });

  // Initialize
  initIcons();
  initStorage();
  createTab('newtab');
})();
