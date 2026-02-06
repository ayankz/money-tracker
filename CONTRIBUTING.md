# Contributing Guide

## Git Workflow

### Commit Message Convention

Мы используем [Conventional Commits](https://www.conventionalcommits.org/) для единообразия commit messages.

#### Формат:
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types:
- `feat`: Новая функциональность
- `fix`: Исправление бага
- `docs`: Изменения в документации
- `style`: Форматирование кода (не влияет на логику)
- `refactor`: Рефакторинг кода
- `perf`: Улучшение производительности
- `test`: Добавление или изменение тестов
- `build`: Изменения в системе сборки или зависимостях
- `ci`: Изменения в CI/CD конфигурации
- `chore`: Другие изменения (обновление зависимостей и т.д.)
- `revert`: Откат предыдущего коммита

#### Примеры:
```bash
# Хорошие примеры
feat(add-category): add search field component
fix(navbar): correct active state styling
docs(readme): update installation instructions
refactor(services): extract category logic to service
perf(search): optimize filtering algorithm
test(icon-picker): add unit tests for icon selection

# Плохие примеры
updated stuff
fixed bug
WIP
changes
```

### Git Hooks

Проект использует **Husky** для автоматических проверок:

#### Pre-commit (перед коммитом):
- ✅ **ESLint** - проверка кода на ошибки
- ✅ **Prettier** - автоформатирование
- ✅ **Type checking** - проверка типов TypeScript

#### Commit-msg (при создании коммита):
- ✅ **Commitlint** - валидация формата commit message

#### Pre-push (перед push):
- ✅ **Tests** - запуск всех тестов
- ✅ **Build** - проверка сборки проекта

### Setup

Установка Git hooks:

```bash
npm install
npm run prepare
```

### Bypass Hooks (не рекомендуется)

Если нужно временно пропустить проверки:

```bash
# Skip pre-commit and commit-msg
git commit --no-verify -m "your message"

# Skip pre-push
git push --no-verify
```

⚠️ **Используйте только в крайних случаях!**

## Development Workflow

### 1. Создание новой ветки

```bash
git checkout -b feat/your-feature-name
# или
git checkout -b fix/bug-description
```

### 2. Разработка

```bash
# Запуск dev сервера
npm start

# Параллельно: watch тесты
npm run test:watch

# Проверка типов
npm run type-check
```

### 3. Форматирование и линтинг

```bash
# Автоматическое форматирование всех файлов
npm run format

# Проверка форматирования
npm run format:check

# Линтинг с автофиксом
npm run lint:fix
```

### 4. Коммит изменений

```bash
# Добавить файлы в staging
git add .

# Коммит (автоматически запустятся pre-commit hooks)
git commit -m "feat(component): add new feature"
```

### 5. Push изменений

```bash
# Push (автоматически запустятся pre-push hooks)
git push origin feat/your-feature-name
```

### 6. Pull Request

1. Откройте Pull Request на GitHub
2. Опишите изменения
3. Дождитесь review
4. Merge после одобрения

## Code Style

### TypeScript

```typescript
// ✅ Good
export interface User {
  id: string;
  name: string;
}

// ❌ Bad
export interface user {
  id: String;
  name: String;
}
```

### Angular Components

```typescript
// ✅ Good - OnPush, signals, standalone
@Component({
  selector: 'app-my-component',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyComponent {
  protected readonly data = signal<string>('');
}

// ❌ Bad - Default change detection, no signals
@Component({
  selector: 'app-my-component',
})
export class MyComponent {
  public data: string = '';
}
```

### SCSS

```scss
// ✅ Good - Use CSS variables
.my-class {
  padding: var(--spacing-lg);
  color: var(--text-primary);
}

// ❌ Bad - Hardcoded values
.my-class {
  padding: 16px;
  color: #140e1b;
}
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests for CI
npm run test:ci
```

## Troubleshooting

### Husky hooks не работают

```bash
# Переустановка hooks
rm -rf .husky
npm run prepare
```

### Prettier конфликтует с ESLint

```bash
# Проверьте что ESLint и Prettier правильно настроены
npm run lint:fix
npm run format
```

### Коммит заблокирован

Если pre-commit hook блокирует коммит:
1. Исправьте ошибки линтинга: `npm run lint:fix`
2. Исправьте форматирование: `npm run format`
3. Исправьте ошибки типов: `npm run type-check`
4. Попробуйте коммит снова

## Useful Commands

```bash
# Форматирование всего проекта
npm run format

# Проверка форматирования
npm run format:check

# Линтинг с автофиксом
npm run lint:fix

# Type checking
npm run type-check

# Сборка prod
npm run build:prod

# Тестирование PWA локально
npm run serve:pwa
```

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Style Guide](https://angular.dev/style-guide)
- [Husky Documentation](https://typicode.github.io/husky/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)