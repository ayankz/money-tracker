> Historical optional tooling notes. Current commands and paths are documented in
> [README.md](README.md). Application code now lives in `apps/web` and `apps/api`;
> the existing optional hooks remain at the repository root and are not activated
> by this migration.

# 🔍 Как работает Husky (под капотом)

## Проблема: Git не знает про Husky

Сейчас в проекте:
```bash
.husky/
  ├── pre-commit     # ✅ файл есть
  ├── commit-msg     # ✅ файл есть
  └── pre-push       # ✅ файл есть

.git/hooks/
  ├── pre-commit.sample    # ❌ только примеры
  ├── commit-msg.sample    # ❌ не активны
  └── ...
```

**Git запускает hooks только из `.git/hooks/`, а НЕ из `.husky/`!**

## Решение: Husky устанавливает мост

### Шаг 1: Установка пакетов

```bash
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional prettier
```

### Шаг 2: Инициализация Husky

```bash
npm run prepare  # запускает "husky install"
```

**Что делает `husky install`:**

1. **Создает `.husky/_/husky.sh`** (служебный скрипт)
2. **Настраивает Git**: `git config core.hooksPath .husky`
3. **Теперь Git использует `.husky/` вместо `.git/hooks/`!**

После этого:
```bash
.husky/
  ├── _/
  │   └── husky.sh        # 🆕 создан автоматически
  ├── pre-commit          # ✅ работает!
  ├── commit-msg          # ✅ работает!
  └── pre-push            # ✅ работает!
```

### Шаг 3: Сделать hooks исполняемыми (macOS/Linux)

```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push
```

## Проверка что Husky работает

```bash
# Проверить настройку Git
git config core.hooksPath
# Должно вывести: .husky

# Проверить что husky.sh существует
ls -la .husky/_/husky.sh
# Должен показать файл

# Тестовый коммит
git add .
git commit -m "test: checking hooks"
# Должны запуститься lint, prettier, type-check
```

## Как работает каждый hook

### 1. Pre-commit hook

Когда ты делаешь `git commit`:

```
git commit
   ↓
Git видит: core.hooksPath = .husky
   ↓
Git запускает: .husky/pre-commit
   ↓
Husky выполняет:
   ├── npx lint-staged  (проверяет только измененные файлы)
   └── npm run type-check  (проверяет TypeScript)
   ↓
Если ошибки → БЛОКИРУЕТ коммит ❌
Если всё ок → РАЗРЕШАЕТ коммит ✅
```

### 2. Commit-msg hook

После того как ты ввел commit message:

```
git commit -m "fixed bug"
   ↓
Git запускает: .husky/commit-msg
   ↓
Commitlint проверяет формат:
   ├── "fixed bug" ❌ неправильный формат
   └── "fix: correct navbar bug" ✅ правильный
   ↓
Если формат неверен → БЛОКИРУЕТ коммит ❌
Если формат верен → РАЗРЕШАЕТ коммит ✅
```

### 3. Pre-push hook

Когда ты делаешь `git push`:

```
git push
   ↓
Git запускает: .husky/pre-push
   ↓
Husky выполняет:
   ├── npm run test:ci  (все тесты)
   └── npm run build  (проверка сборки)
   ↓
Если тесты упали → БЛОКИРУЕТ push ❌
Если всё ок → РАЗРЕШАЕТ push ✅
```

## Детали работы lint-staged

Файл `.lintstagedrc.json`:

```json
{
  "*.{ts,js}": [
    "eslint --fix",      // исправить код
    "prettier --write"   // отформатировать
  ],
  "*.{html,scss}": [
    "prettier --write"   // только форматирование
  ]
}
```

**Как это работает:**

```bash
git add src/app/component.ts
git commit -m "feat: add component"
   ↓
Lint-staged видит: component.ts изменен
   ↓
Запускает:
   1. eslint --fix src/app/component.ts
   2. prettier --write src/app/component.ts
   ↓
Если изменения внесены → автоматически добавляет в staging
   ↓
Коммит создается с отформатированным кодом ✅
```

## Почему это senior-level?

### ❌ Без Husky:
- Разработчики забывают запускать lint
- Разный стиль кода у команды
- Broken code попадает в репозиторий
- CI/CD падает после push

### ✅ С Husky:
- Автоматическая проверка качества кода
- Единый стиль во всей команде
- Ошибки ловятся ДО попадания в репозиторий
- CI/CD всегда зеленый
- Профессиональный workflow

## Bypass hooks (только для emergencies!)

```bash
# Пропустить pre-commit и commit-msg
git commit --no-verify -m "emergency fix"

# Пропустить pre-push
git push --no-verify
```

⚠️ **Используй ОЧЕНЬ редко!** Это обходит все проверки качества.

## Troubleshooting

### Hooks не запускаются

```bash
# Проверить настройку
git config core.hooksPath

# Если пусто или неправильно
npm run prepare

# Проверить права
ls -l .husky/pre-commit
# Должно быть: -rwxr-xr-x (исполняемый)

# Если нет
chmod +x .husky/*
```

### Husky not found

```bash
# Убедись что пакет установлен
npm list husky

# Если нет
npm install -D husky
npm run prepare
```

### Windows проблемы

На Windows используй:
- **Git Bash** (рекомендуется)
- или WSL2
- или PowerShell с правами администратора

## Итого: Магия под капотом ✨

```
1. npm install husky        → Устанавливает пакет
2. npm run prepare          → husky install
3. husky install            → git config core.hooksPath .husky
4. git commit               → Git смотрит в .husky/ вместо .git/hooks/
5. .husky/pre-commit        → Запускается автоматически!
6. lint-staged + type-check → Проверяют код
7. Коммит создается         → Только если всё ок ✅
```

Теперь Git **знает** про Husky и автоматически запускает твои hooks! 🎣
