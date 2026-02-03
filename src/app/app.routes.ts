import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
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
  }
];
