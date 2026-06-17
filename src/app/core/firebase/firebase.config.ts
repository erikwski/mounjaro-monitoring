import { ApplicationConfig } from '@angular/core';
import { provideFirebaseApp, initializeApp, getApps, getApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideMessaging, getMessaging } from '@angular/fire/messaging';
import { environment } from '../../../environments/environment';

export const firebaseProviders: ApplicationConfig['providers'] = [
  provideFirebaseApp(() => getApps().length ? getApp() : initializeApp(environment.firebase)),
  provideAuth(() => getAuth()),
  provideFirestore(() => getFirestore()),
  provideMessaging(() => getMessaging()),
];
