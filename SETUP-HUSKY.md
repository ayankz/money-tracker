# 🎣 Husky Setup Guide

## Установка зависимостей

Выполни эти команды для полной настройки Husky и Git hooks:

```bash
# 1. Установить основные зависимости
npm install -D husky lint-staged

# 2. Установить commitlint для валидации commit messages
npm install -D @commitlint/cli @commitlint/config-conventional

# 3. Установить prettier для форматирования
npm install -D prettier

# 4. Инициализировать husky
npm run prepare

# 5. Сделать hooks исполняемыми (macOS/Linux)
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push
```

## Проверка установки

После установки проверь что всё работает:

```bash
# 1. Проверка prettier
npm run format:check

# 2. Проверка lint
npm run lint

# 3. Проверка type-check
npm run type-check

# 4. Тестовый коммит
git add .
git commit -m "test: check husky setup"
```

## Структура файлов

После установки у тебя появятся:

```
.husky/
  ├── _/              (сгенерировано husky)
  ├── pre-commit      (линтинг + форматирование)
  ├── commit-msg      (валидация commit message)
  └── pre-push        (тесты + сборка)

.commitlintrc.json    (правила для commit messages)
.lintstagedrc.json    (настройки lint-staged)
.prettierrc.json      (настройки prettier)
.prettierignore       (игнор файлы для prettier)
```

## Что делают hooks

### Pre-commit (перед каждым коммитом)
1. **Lint-staged** - проверяет только измененные файлы
2. **ESLint** - исправляет код автоматически
3. **Prettier** - форматирует код
4. **Type-check** - проверяет TypeScript типы

### Commit-msg (при создании коммита)
1. **Commitlint** - проверяет формат commit message
2. Требует формат: `type(scope): subject`

### Pre-push (перед push в remote)
1. **Tests** - запускает все тесты
2. **Build** - проверяет что проект собирается

## Примеры правильных commit messages

```bash
✅ feat(auth): add login page
✅ fix(navbar): correct active link styling
✅ docs(readme): update installation steps
✅ refactor(services): extract user logic
✅ perf(search): optimize query performance
✅ test(button): add click event tests
✅ style(header): format code with prettier
✅ chore(deps): update angular to v21

❌ added stuff
❌ fix bug
❌ WIP
❌ updates
```

## Troubleshooting

### Hooks не запускаются

```bash
# Переустанови husky
rm -rf .husky
npm run prepare
chmod +x .husky/*
```

### Permission denied на macOS/Linux

```bash
# Сделай hooks исполняемыми
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push
```

### Windows: husky не работает

На Windows используй:
- Git Bash
- или WSL2
- или PowerShell с правами администратора

### Commit заблокирован

Если hook блокирует commit:

```bash
# 1. Исправь ошибки
npm run lint:fix
npm run format
npm run type-check

# 2. Попробуй снова
git add .
git commit -m "fix: your message"

# 3. Если нужно пропустить (не рекомендуется!)
git commit --no-verify -m "your message"
```

## Команды

```bash
# Форматирование
npm run format              # Отформатировать весь проект
npm run format:check        # Проверить форматирование

# Линтинг
npm run lint                # Проверить код
npm run lint:fix            # Исправить автоматически

# Type checking
npm run type-check          # Проверить TypeScript типы

# Тестирование
npm test                    # Запустить тесты
npm run test:ci             # Тесты для CI

# Сборка
npm run build               # Dev сборка
npm run build:prod          # Production сборка
```

## Кастомизация

### Отключить определенный hook

Просто удали или закомментируй файл:

```bash
# Временно отключить pre-push
mv .husky/pre-push .husky/pre-push.disabled

# Вернуть обратно
mv .husky/pre-push.disabled .husky/pre-push
```

### Изменить правила commitlint

Отредактируй `.commitlintrc.json`:

```json
{
  "rules": {
    "header-max-length": [2, "always", 150] // увеличить лимит
  }
}
```

### Добавить свои типы коммитов

В `.commitlintrc.json`:

```json
{
  "rules": {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "wip", "experimental"] // добавить типы
    ]
  }
}
```

## Ready to go! 🚀

После установки твой workflow:

```bash
# 1. Разработка
git checkout -b feat/new-feature
npm start

# 2. Изменения
# ... code changes ...

# 3. Коммит (автоматически: lint, format, type-check)
git add .
git commit -m "feat(component): add new feature"

# 4. Push (автоматически: tests, build)
git push origin feat/new-feature
```

Всё автоматизировано! 🎉