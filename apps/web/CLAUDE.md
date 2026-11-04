# CLAUDE.md — save-to-dream (money-tracker)

Angular 21 PWA для трекинга личных финансов.

## Commands

```bash
npm start              # dev server
npm run build:prod     # production build
npm test               # тесты (Vitest)
npm run serve:pwa      # build + serve PWA локально
```

## Architecture

```
src/app/
├── components/   # переиспользуемые UI компоненты
├── layouts/      # main-layout (с navbar), fullscreen-layout (без navbar)
├── pages/        # страницы (lazy-loaded)
├── services/     # base-http, category, operations
├── store/        # NgRx Signals store (operations.store.ts)
├── models/       # модели данных
└── types/        # TypeScript типы
```

Роутинг: lazy-loaded через `loadComponent()`.

## Conventions

### Components
- Все компоненты **standalone**
- `changeDetection: ChangeDetectionStrategy.OnPush` везде
- `input()` / `output()` вместо `@Input()` / `@Output()`
- Локальный стейт — `signal()`, производный — `computed()`

### Dependency Injection
- Только `inject()` — никакого constructor DI

### State Management
- NgRx Signals store (`signalStore`) в `src/app/store/`
- `withState`, `withComputed`, `withMethods` + `rxMethod` для async
- Сервис-фасад оборачивает store для упрощённого доступа

### HTTP
- Только через `BaseHttp` (не использовать `HttpClient` напрямую)
- Возвращает Observable, конвертируется через `toSignal()` при необходимости

### Styling
- Компоненты используют **только `var(--name)`** — никаких SCSS imports в компонентах
- Все токены определены в `src/styles/_variables.scss` → `_css-variables.scss`
- Доступные утилиты: миксины из `_mixins.scss` (flex-center, card-base, respond-to и др.)

### Forms
- Reactive Forms + `toSignal()` для интеграции с signals
- Валидность формы через `computed()` зависящий от сигналов

## Git / Commits

Формат коммитов (conventional commits):
```
feat: add category filter
fix: correct balance calculation
```

Доступные типы: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

Husky автоматически запускает:
- **pre-commit**: lint-staged + type-check
- **commit-msg**: commitlint
- **pre-push**: тесты + build

## Testing

- Vitest + Angular TestBed
- Файлы: `*.spec.ts` рядом с тестируемым файлом
