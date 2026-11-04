# 📱 Установка PWA на iOS - Пошаговая Инструкция

## ⚠️ Важно!

iOS Safari **НЕ показывает автоматический баннер установки**, в отличие от Android Chrome.
Установка происходит **вручную** через меню "Поделиться".

## 📋 Инструкция по установке:

### Шаг 1: Откройте сайт в Safari
- ✅ Используйте **Safari** (не Chrome, не Firefox)
- ✅ Откройте ваш сайт

### Шаг 2: Нажмите кнопку "Поделиться"
```
┌─────────────────────┐
│                     │
│    Ваш сайт         │
│                     │
└─────────────────────┘
       [⬆️] ← Внизу экрана
```

### Шаг 3: Найдите "На экран «Домой»"
- Пролистайте список действий **вниз**
- Найдите пункт **"На экран «Домой»"** с иконкой [➕]
- Нажмите на него

### Шаг 4: Подтвердите установку
```
┌─────────────────────┐
│ SaveToDream    [✕]  │
├─────────────────────┤
│  [Иконка]           │
│                     │
│  SaveToDream        │
│  localhost:8080     │
│                     │
│  [Добавить] ←       │
└─────────────────────┘
```

### Шаг 5: Готово! ✅
Иконка появится на домашнем экране рядом с другими приложениями.

## 🎯 Что должно работать:

После установки на iOS:
- ✅ Иконка на домашнем экране
- ✅ Открывается в полноэкранном режиме (без Safari UI)
- ✅ Работает как отдельное приложение
- ✅ Есть в списке недавних приложений
- ⚠️ Офлайн работает **частично** (iOS ограничивает Service Workers)

## 🔧 Требования для iOS PWA:

### Обязательно:
- ✅ HTTPS (или localhost для тестирования)
- ✅ Валидный `manifest.json`
- ✅ Meta-тег `apple-mobile-web-app-capable`
- ✅ Иконки для iOS (`apple-touch-icon`)
- ✅ Хотя бы одна иконка 180x180px или больше

### Рекомендуется:
- ✅ Splash screens для iOS
- ✅ Status bar styling
- ✅ Viewport meta с `viewport-fit=cover`

## 🐛 Troubleshooting

### ❌ Не появляется "На экран «Домой»"?

**Причины:**
1. Открыто не в Safari (откройте в Safari)
2. Приватный режим (выйдите из приватного режима)
3. Сайт уже установлен (удалите с домашнего экрана и попробуйте снова)

### ❌ Иконка выглядит плохо?

**Решение:**
- Добавьте `apple-touch-icon` размером 180x180px
- Убедитесь что иконка находится в `public/icons/`

### ❌ Приложение открывается в Safari?

**Проверьте:**
```html
<meta name="apple-mobile-web-app-capable" content="yes">
```
Должно быть в `<head>` вашего HTML.

### ❌ Офлайн не работает?

**iOS ограничения:**
- Service Workers работают, но с ограничениями
- Кеш может быть очищен через 7 дней неактивности
- Push-уведомления **не работают** на iOS (до iOS 16.4+)

## 📊 Различия iOS vs Android:

| Функция | Android Chrome | iOS Safari |
|---------|---------------|------------|
| Автоматический баннер установки | ✅ Да | ❌ Нет |
| Service Worker | ✅ Полный | ⚠️ Ограниченный |
| Офлайн режим | ✅ Полный | ⚠️ Частичный |
| Push-уведомления | ✅ Да | ⚠️ iOS 16.4+ только |
| Background Sync | ✅ Да | ❌ Нет |
| Установка | Один клик | Ручная |

## 🎨 Оптимизация для iOS:

### Добавьте apple-touch-startup-image:

```html
<!-- iPhone X/XS/11 Pro -->
<link rel="apple-touch-startup-image"
      media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
      href="/splash/iphone-x.png">

<!-- iPhone XR/11 -->
<link rel="apple-touch-startup-image"
      media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
      href="/splash/iphone-xr.png">
```

### Safe Area для iPhone с вырезом:

```css
body {
  padding: env(safe-area-inset-top)
           env(safe-area-inset-right)
           env(safe-area-inset-bottom)
           env(safe-area-inset-left);
}
```

## 🔗 Полезные ссылки:

- [iOS PWA Guide](https://web.dev/learn/pwa/ios/)
- [Apple Web App Meta Tags](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [iOS PWA Limitations](https://firt.dev/ios-14.5/)

## ✅ Checklist для iOS PWA:

- [ ] Открыт в Safari (не в другом браузере)
- [ ] HTTPS или localhost
- [ ] `apple-mobile-web-app-capable` meta-тег добавлен
- [ ] `apple-touch-icon` добавлены (180x180px минимум)
- [ ] Manifest.json валидный
- [ ] Тестирование: открыть → Share → Add to Home Screen
- [ ] После установки: проверить полноэкранный режим
- [ ] Проверить офлайн (частичная поддержка)
