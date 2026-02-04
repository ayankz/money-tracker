# Layout Architecture

This directory contains layout components that define different page structures.

## Available Layouts

### 1. MainLayout
**Location:** `main-layout/`

**Features:**
- Includes bottom navigation bar (Navbar)
- Adds padding for content above navbar
- Used for primary app screens

**Routes using this layout:**
- `/home` - Home page
- `/operations` - Operations/Activity page
- `/analytics` - Analytics/Stats page
- `/planned-payments` - Planned payments page
- `/profile` - Profile page

### 2. FullscreenLayout
**Location:** `fullscreen-layout/`

**Features:**
- No navigation bar
- Full-screen experience
- Used for forms and focused tasks

**Routes using this layout:**
- `/add-card` - Add new card form
- `/add-category` - Add new category form
- `/add-transaction` - Add new transaction form

## Architecture Benefits

### ✅ Separation of Concerns
Each layout is responsible for its own structure and navigation elements.

### ✅ Reusability
Layouts can be reused across multiple routes without code duplication.

### ✅ Maintainability
Changes to navigation or layout structure only need to be made in one place.

### ✅ Lazy Loading
Layouts are lazy-loaded along with their child routes for optimal performance.

### ✅ Scalability
Easy to add new layouts (e.g., AuthLayout, AdminLayout) as the app grows.

## Adding a New Layout

1. Create a new directory: `src/app/layouts/your-layout/`
2. Create component files:
   - `your-layout.ts`
   - `your-layout.html`
   - `your-layout.scss`
3. Add `<router-outlet />` in the template
4. Update `app.routes.ts` with new route group
5. Document it here

## Example Route Configuration

```typescript
{
  path: '',
  loadComponent: () => import('./layouts/main-layout/main-layout').then(m => m.MainLayout),
  children: [
    {
      path: 'home',
      loadComponent: () => import('./pages/home/home').then(m => m.Home)
    }
  ]
}
```
