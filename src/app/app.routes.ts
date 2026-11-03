import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard, hasAccountsGuard, homeGuard, needsSetupGuard, userGuard } from './core/auth/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', canActivate: [homeGuard], children: [] },
  {
    path: '',
    loadComponent: () => import('./layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent) },
      { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent) },
      { path: 'check-inbox', loadComponent: () => import('./features/auth/check-inbox.component').then((m) => m.CheckInboxComponent) },
      { path: 'forgot-password', canActivate: [guestGuard], loadComponent: () => import('./features/auth/forgot.component').then((m) => m.ForgotComponent) },
      { path: 'reset-password', loadComponent: () => import('./features/auth/reset.component').then((m) => m.ResetComponent) },
      { path: 'confirm-email', loadComponent: () => import('./features/auth/confirm-email.component').then((m) => m.ConfirmEmailComponent) },
    ],
  },
  { path: 'setup', canActivate: [authGuard, userGuard, needsSetupGuard], loadComponent: () => import('./features/setup/setup.component').then((m) => m.SetupComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        canActivate: [userGuard, hasAccountsGuard],
        children: [
          { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
          { path: 'transactions', loadComponent: () => import('./features/transactions/transactions.component').then((m) => m.TransactionsComponent) },
          { path: 'accounts', loadComponent: () => import('./features/accounts/accounts.component').then((m) => m.AccountsComponent) },
          { path: 'categories', loadComponent: () => import('./features/categories/categories.component').then((m) => m.CategoriesComponent) },
        ],
      },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent) },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'users' },
          { path: 'users', loadComponent: () => import('./features/admin/users.component').then((m) => m.UsersComponent) },
          { path: 'users/:userId/transactions', loadComponent: () => import('./features/transactions/transactions.component').then((m) => m.TransactionsComponent) },
        ],
      },
    ],
  },
  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent) },
];
