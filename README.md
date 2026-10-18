# Material Browser 🌐🎨

Современный веб-браузер на базе **Chromium** (Blink + V8) с пользовательским интерфейсом в стиле **Google Material Design 3 (Material You)**.

---

## ✨ Основные возможности

- 🚀 **Полноценный движок Chromium**: Быстрый и современный веб-рендеринг, поддержка HTML5, CSS3, WebAssembly, DevTools.
- 🎨 **Google Material Design 3 (Material You)**:
  - Динамическая палитра цветов и акцентов (Indigo, Purple, Emerald, Amber, Rose).
  - Поддержка темной и светлой тем с мгновенным переключением.
  - Закругленные формы, карточки, элевации и микроанимации.
- 📑 **Вкладки (Material Tabs)**:
  - Удобная панель вкладок с фавиконками сайтов и кнопкой новой вкладки (`+`).
  - Быстрое закрытие и переключение активной вкладки.
- 🔍 **Умный Omnibox (Адресная строка)**:
  - Автоматическое распознавание URL и поисковых запросов.
  - Выбор поисковой системы: Google, DuckDuckGo, Bing, Yandex.
  - Индикатор безопасности SSL/HTTPS (зеленый замочек).
  - Кнопка быстрого добавления в закладки со звездочкой.
- 🏠 **Material New Tab Page (NTP)**:
  - Большие цифровые часы и динамическое приветствие в зависимости от времени суток.
  - Карточки быстрого доступа к популярным сайтам (YouTube, GitHub, Google, Wikipedia).
- ⭐ **Закладки и история**:
  - Панель закладок для моментального перехода.
  - История посещений с временными метками.
  - Очистка данных и кэша в один клик.
- ⌨️ **Горячие клавиши**:
  - `Ctrl + T` — Новая вкладка
  - `Ctrl + W` — Закрыть текущую вкладку
  - `Ctrl + R` / `F5` — Перезагрузить страницу
  - `Ctrl + L` — Фокус на адресную строку
  - `Ctrl + H` — История посещений
  - `F12` — Инструменты разработчика (DevTools)

---

## 📁 Структура проекта

```text
materialbrowser/
├── .github/
│   └── workflows/
│       └── build.yml        # CI/CD: автоматическая сборка Windows .exe в GitHub Actions
├── assets/
│   ├── icon.ico             # Иконка приложения для Windows
│   └── icon.png             # Логотип высокого разрешения
├── src/
│   ├── main/
│   │   ├── main.js          # Главный процесс Electron (окно, хранилище, загрузки)
│   │   └── preload.js       # Безопасный IPC мост между Chromium и интерфейсом
│   └── renderer/
│       ├── index.html       # HTML каркас браузера и модальных окон
│       ├── styles.css       # Стили Material Design 3 (токены, цвета, анимации)
│       ├── icons.js         # SVG иконки Material Symbols
│       └── app.js           # Логика вкладок, навигации, закладок и настроек
├── package.json             # Конфигурация зависимостей и electron-builder
└── .gitignore               # Игнорируемые файлы (node_modules, dist)
```

---

## 🛠️ Сборка в GitHub Actions

Весь процесс компиляции и сборки Windows-установщика и портативной версии настроен в файле [`.github/workflows/build.yml`](.github/workflows/build.yml).

### Как запустить сборку:

1. **Инициализируйте репозиторий и отправьте код на GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Material Browser"
   git branch -M main
   git remote add origin https://github.com/ВАШ_ЛОГИН/materialbrowser.git
   git push -u origin main
   ```

2. **Автоматический билд:**
   - При каждом `push` в ветку `main` GitHub Actions автоматически запустит сборку на виртуальной машине `windows-latest`.
   - Также билд можно запустить вручную в любой момент: вкладка **Actions** на GitHub → **Build Material Browser (Chromium)** → **Run workflow**.

3. **Скачивание готового браузера:**
   - Перейдите во вкладку **Actions** в вашем репозитории на GitHub.
   - Откройте завершенный запуск сборки.
   - Внизу в блоке **Artifacts** скачайте архив `MaterialBrowser-Windows-x64`:
     - `Material Browser Setup 1.0.0.exe` — установщик с ярлыками на рабочем столе и в меню Пуск.
     - `Material Browser 1.0.0.exe` — портативная версия, работающая без установки.

4. **Автоматический релиз:**
   Если создать тег версии (например, `v1.0.0`) и отправить его:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
   GitHub Actions автоматически создаст официальный **GitHub Release** и прикрепит готовые `.exe` файлы в раздел Releases!
