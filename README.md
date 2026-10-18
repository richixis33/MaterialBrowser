# Material Browser Expressive 🌐🎨✨

[![Build Status](https://github.com/richixis33/MaterialBrowser/actions/workflows/build.yml/badge.svg)](https://github.com/richixis33/MaterialBrowser/actions)
![Release](https://img.shields.io/badge/version-1.0.0-purple)
![Chromium](https://img.shields.io/badge/engine-Chromium-blue)
![Design](https://img.shields.io/badge/UI-Material_You_M3_Expressive-6750A4)

Современный веб-браузер на базе **Chromium** (Blink + V8) с инновационным интерфейсом **Google Material Design 3 Expressive (Material You)**, динамической генерацией темы по обоям и анимациями смены формы.

---

## ✨ Основные возможности

- 🚀 **Полноценный Chromium внутри**: Высокая скорость, полная совместимость с современным веб-стеком (HTML5, CSS3, WebAssembly, DevTools F12).
- 🎨 **Material You Dynamic Theming (Monet Engine)**:
  - **Динамические обои**: возможность загрузить любую собственную картинку (драг-н-дроп или выбор файла).
  - **Автоизвлечение цветов**: браузер автоматически считывает доминантные оттенки с ваших обоев и перекрашивает весь интерфейс (вкладки, адресную строку, модальные окна, кнопки) в гармоничную палитру Material 3!
  - **Сплошной цвет**: выбор любого цвета через цветовую палитру с автоматической тональной адаптацией.
  - **Готовые темы**: Cosmic Violet, Aurora Emerald, Sunset Amber, Deep Ocean, Cyber Rose.
- 🌀 **Экспрессивный Shape-Morphing Loader**:
  - Анимированный спиннер загрузки в стиле Android 15 / Material Design 3 Expressive, который плавно трансформирует свою форму (круг ➔ четырехконечная звезда ➔ волнистый 8-угольник ➔ лепесток ➔ круг) при загрузке страниц во вкладках!
- 🦆 **DuckDuckGo по умолчанию**:
  - Поисковая система по умолчанию настроена на DuckDuckGo с заботой о приватности.
  - Фирменная поисковая капсула DuckDuckGo на новой вкладке и в Omnibox.
- 📑 **Плавающие вкладки (Floating Pills)**:
  - Парящие закругленные вкладки с мягким свечением активной вкладки и плавной анимацией закрытия.
- 🔍 **Умный Omnibox**:
  - Распознавание URL и поисковых запросов.
  - Индикатор безопасности SSL/HTTPS и бейдж DuckDuckGo.
  - Быстрое добавление в закладки.
- 🏠 **Новая вкладка (NTP)**:
  - Большие цифровые часы в стиле Material You и динамическое приветствие.
  - Бенто-карточки быстрого доступа к популярным сайтам.
  - Floating Action Button (FAB) «Customize» для моментальной настройки темы прямо с домашней страницы.
- ⌨️ **Горячие клавиши**:
  - `Ctrl + T` — Новая вкладка
  - `Ctrl + W` — Закрыть вкладку
  - `Ctrl + R` / `F5` — Перезагрузить
  - `Ctrl + L` — Фокус на Omnibox
  - `Ctrl + H` — История
  - `F12` — Инструменты разработчика

---

## 📁 Структура проекта

```text
materialbrowser/
├── .github/
│   └── workflows/
│       └── build.yml        # CI/CD: автосборка Windows .exe в GitHub Actions
├── assets/
│   ├── icon.ico             # Иконка приложения (все слои от 16x16 до 256x256)
│   └── icon.png             # Логотип высокого разрешения (512x512)
├── src/
│   ├── main/
│   │   ├── main.js          # Electron Main: frameless-окно, хранилище, загрузки
│   │   └── preload.js       # Безопасный IPC мост
│   └── renderer/
│       ├── index.html       # Expressive каркас браузера, Wallpaper Studio
│       ├── styles.css       # Material 3 Expressive стили, shape-morph анимации
│       ├── themeEngine.js   # Движок динамического извлечения палитры Monet
│       ├── icons.js         # SVG иконки Material Symbols и DuckDuckGo
│       └── app.js           # Логика вкладок, webview, обоев и поиска
├── package.json             # Зависимости и скрипты сборщика
└── .gitignore               # Игнорируемые файлы (node_modules, dist)
```

---

## 🛠️ Сборка в GitHub Actions

Сборка полностью автоматизирована и выполняется на раннере `windows-latest`:
1. При каждом `push` в ветку `main` в разделе **Actions** запускается воркфлоу **Build Material Browser (Chromium)**.
2. Готовые файлы установщика (`.exe`) и портативной версии доступны во вкладке **Actions** ➔ **Artifacts** ➔ **MaterialBrowser-Windows-x64**.
