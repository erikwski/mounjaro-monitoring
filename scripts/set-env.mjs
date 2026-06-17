import { writeFileSync } from 'fs';

const e = process.env;

const content = `export const environment = {
  production: true,
  firebase: {
    apiKey: '${e.FIREBASE_API_KEY ?? ''}',
    authDomain: '${e.FIREBASE_AUTH_DOMAIN ?? ''}',
    projectId: '${e.FIREBASE_PROJECT_ID ?? ''}',
    storageBucket: '${e.FIREBASE_STORAGE_BUCKET ?? ''}',
    messagingSenderId: '${e.FIREBASE_MESSAGING_SENDER_ID ?? ''}',
    appId: '${e.FIREBASE_APP_ID ?? ''}',
    vapidKey: '${e.FIREBASE_VAPID_KEY ?? ''}',
  },
};
`;

writeFileSync('src/environments/environment.prod.ts', content);
console.log('Generated environment.prod.ts from env vars');
