import { ApplicationConfig } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideMessaging, getMessaging } from '@angular/fire/messaging';
import { environment } from '../../../environments/environment';

// provideMessaging factory is lazy — getMessaging() is only called when Messaging is first
// injected (i.e. in SettingsComponent on the browser), so this is SSR-safe.
export const firebaseProviders: ApplicationConfig['providers'] = [
  provideFirebaseApp(() => initializeApp(environment.firebase)),
  provideAuth(() => getAuth()),
  provideFirestore(() => getFirestore()),
  provideMessaging(() => getMessaging()),
];
