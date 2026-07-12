import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestOnlyGuard } from './guards/guest-only.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  // Routes with MainLayout (with navbar)
  {
    path: '',
    canActivate: [authGuard],
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
      },
      {
        path: 'my-money',
        loadComponent: () => import('./pages/my-money/my-money').then(m => m.MyMoney)
      }
    ]
  },
  // Routes with FullscreenLayout (without navbar) - protected
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/fullscreen-layout/fullscreen-layout').then(m => m.FullscreenLayout),
    children: []
  },
  {
    path: 'add-account',
    outlet: 'sheet',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/bottom-sheet-layout/bottom-sheet-layout').then(m => m.BottomSheetLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/add-account/add-account').then(m => m.AddAccount)
      }
    ]
  },
  {
    path: 'add-category',
    outlet: 'sheet',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/bottom-sheet-layout/bottom-sheet-layout').then(m => m.BottomSheetLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/add-category/add-category').then(m => m.AddCategory)
      }
    ]
  },
  {
    path: 'add-transaction',
    outlet: 'sheet',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/bottom-sheet-layout/bottom-sheet-layout').then(m => m.BottomSheetLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/add-transaction/add-transaction').then(m => m.AddTransaction)
      }
    ]
  },
  // Public routes (no auth required)
  {
    path: 'auth',
    canActivate: [guestOnlyGuard],
    loadComponent: () => import('./pages/auth/auth').then(m => m.Auth)
  },
  {
    path: 'signup',
    canActivate: [guestOnlyGuard],
    loadComponent: () => import('./pages/signup/signup').then(m => m.Signup)
  }
];
