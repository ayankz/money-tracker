import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  // Routes with MainLayout (with navbar)
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout').then(m => m.MainLayout),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home').then(m => m.Home)
      },
      {
        path: 'operations',
        loadComponent: () => import('./pages/operations/operations').then(m => m.Operations)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./pages/analytics/analytics').then(m => m.Analytics)
      },
      {
        path: 'planned-payments',
        loadComponent: () => import('./pages/planned-payments/planned-payments').then(m => m.PlannedPayments)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile').then(m => m.Profile)
      }
    ]
  },
  // Routes with FullscreenLayout (without navbar)
  {
    path: '',
    loadComponent: () => import('./layouts/fullscreen-layout/fullscreen-layout').then(m => m.FullscreenLayout),
    children: [
      {
        path: 'add-card',
        loadComponent: () => import('./pages/add-card/add-card').then(m => m.AddCard)
      },
      {
        path: 'add-category',
        loadComponent: () => import('./pages/add-category/add-category').then(m => m.AddCategory)
      },
      {
        path: 'add-transaction',
        loadComponent: () => import('./pages/add-transaction/add-transaction').then(m => m.AddTransaction)
      }
    ]
  }
];
