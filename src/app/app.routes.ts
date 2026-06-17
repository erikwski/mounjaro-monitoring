import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { onboardingGuard } from './core/auth/onboarding.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/onboarding/onboarding.component').then((m) => m.OnboardingComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'daily-log',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () =>
      import('./features/daily-log/daily-log.component').then((m) => m.DailyLogComponent),
  },
  {
    path: 'injection',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () =>
      import('./features/injection/injection.component').then((m) => m.InjectionComponent),
  },
  {
    path: 'measurements',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () =>
      import('./features/measurements/measurements.component').then((m) => m.MeasurementsComponent),
  },
  {
    path: 'progress',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () =>
      import('./features/progress/progress.component').then((m) => m.ProgressComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () =>
      import('./features/settings/settings.component').then((m) => m.SettingsComponent),
  },
  { path: '**', redirectTo: '/dashboard' },
];
