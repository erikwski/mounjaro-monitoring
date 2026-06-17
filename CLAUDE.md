# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start                    # dev server at http://localhost:4200 (no SSR)
npm run build                # production build
npm test                     # unit tests (vitest)
npm run lint                 # ESLint
vercel dev                   # dev server with SSR + Vercel API routes
```

Run a single test file:
```bash
npx vitest run src/app/path/to/spec.ts
```

## Architecture

### Stack
- **Angular 21** — standalone components, Signals, SSR via `@angular/ssr`
- **Angular Material 21** — cyan-orange M3 theme, configured in `src/styles.scss`
- **Firebase** — Auth (Google only) + Firestore + FCM for push notifications
- **AngularFire 21 RC** — `@angular/fire/auth`, `/firestore`, `/messaging`
- **ngx-echarts + echarts** — charts in `ProgressComponent`
- **Vercel** — hosting + hourly cron job for push notification scheduling

### Data model (Firestore)
All data is scoped to `users/{uid}/`:
- **Root doc** (`users/{uid}`) — profile, therapy config (injection day, dose), notification prefs, FCM token
- **`measurements/{YYYY-MM}`** — monthly body measurements (weight + 9 circumferences in cm)
- **`dailyLogs/{YYYY-MM-DD}`** — daily entries: water (L), sleep (h), glucose morning + evening (mg/dL), optional stress/activity
- **`injections/{YYYY-MM-DD}`** — weekly injection log

### Feature cadences (cousin's requirements)
- **Once**: personal profile (onboarding)
- **Monthly**: weight + body measurements (`measurements/`)
- **Weekly**: injection log (`injections/`)
- **Daily**: water, sleep (`dailyLogs/`)
- **Daily 2×**: blood glucose AM + PM (`dailyLogs/`, `glucoseMorning` + `glucoseEvening`, unit: mg/dL)

### Directory layout
```
src/app/
  core/
    auth/         AuthService, authGuard, onboardingGuard
    firebase/     firebaseProviders (app.config.ts entry point)
    models/       TypeScript interfaces + barrel export (index.ts)
  features/
    auth/         LoginComponent (Google sign-in)
    onboarding/   4-step stepper; writes users/{uid} + first measurements/{YYYY-MM}
    dashboard/    Today's completion status + quick-action tiles
    daily-log/    Daily entry form (glucose, water, sleep, optional stress/activity)
    injection/    Weekly injection log form
    measurements/ Monthly measurements entry + history tab
    progress/     3-tab charts: weight / glucose / body measurements radar
    settings/     FCM token request, notification times, dose update, sign-out
  shared/
    services/     UserService, DailyLogService, MeasurementService, InjectionService
api/
  notify.ts       Vercel Serverless Function called hourly by Vercel Cron; sends FCM via firebase-admin
```

### Auth flow
`authGuard` blocks unauthenticated users → `/login`.
`onboardingGuard` checks `users/{uid}.onboardingComplete`; redirects to `/onboarding` if false.
Both guards use `toObservable(auth.user)` + `filter(u => u !== undefined)` to wait for the Firebase auth state to resolve before deciding.

### Push notifications
Client: `SettingsComponent` requests `Notification.permission`, calls `getToken(messaging, {vapidKey})`, saves the FCM token to Firestore.
Server: `api/notify.ts` runs every hour (Vercel Cron). It reads all users, converts UTC hour to their timezone, checks if they're due for morning/evening/injection/monthly reminders, and sends FCM messages via `firebase-admin`.

### Environment & secrets
- Dev: `src/environments/environment.ts` — fill in Firebase config values (not committed)
- Prod: `src/environments/environment.prod.ts` — reads from `process.env` at build time
- Vercel env vars needed: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, `FIREBASE_VAPID_KEY`, `FIREBASE_SERVICE_ACCOUNT_BASE64` (base64-encoded service account JSON for `api/notify.ts`), `CRON_SECRET` (random secret for cron auth header)

### SSR notes
`provideMessaging(() => getMessaging())` is registered in the shared config but is lazy — `getMessaging()` is only called when `Messaging` is injected (`SettingsComponent`), which never happens during server-side rendering.
