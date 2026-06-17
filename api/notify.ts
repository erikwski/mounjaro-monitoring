import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin once
function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  const serviceAccount = JSON.parse(
    Buffer.from(process.env['FIREBASE_SERVICE_ACCOUNT_BASE64']!, 'base64').toString('utf8'),
  );
  return initializeApp({ credential: cert(serviceAccount) });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret
  if (req.headers['authorization'] !== `Bearer ${process.env['CRON_SECRET']}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  getAdminApp();
  const db = getFirestore();
  const messaging = getMessaging();

  const nowUTC = new Date();
  const currentHour = nowUTC.getUTCHours();
  const todayISO = nowUTC.toISOString().split('T')[0];
  const currentMonth = todayISO.slice(0, 7);
  const dayOfWeek = nowUTC.getUTCDay(); // 0=Sun, 1=Mon...
  const dayOfMonth = nowUTC.getUTCDate();

  const usersSnap = await db.collection('users').get();
  const results = { sent: 0, skipped: 0, errors: 0 };

  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data();
    if (!user['fcmToken'] || !user['notificationsEnabled']) {
      results.skipped++;
      continue;
    }

    const tz = user['notifyTimezone'] || 'Europe/Rome';
    const userHour = getLocalHour(nowUTC, tz);

    let notification: { title: string; body: string } | null = null;

    // Morning notification
    const morningHour = parseInt((user['notifyMorningTime'] || '08:00').split(':')[0]);
    if (userHour === morningHour) {
      // Check if daily log is missing morning glucose
      const logDoc = await db.doc(`users/${userDoc.id}/dailyLogs/${todayISO}`).get();
      const log = logDoc.data();
      if (!log?.['glucoseMorning']) {
        notification = {
          title: '🩸 Misura la glicemia',
          body: 'Buongiorno! Ricorda di misurare la glicemia a digiuno.',
        };
      }

      // Monthly measurement reminder (1st of month)
      if (dayOfMonth === 1) {
        const measDoc = await db.doc(`users/${userDoc.id}/measurements/${currentMonth}`).get();
        if (!measDoc.exists) {
          notification = {
            title: '📏 Misurazioni mensili',
            body: 'È il momento di registrare le misure del mese!',
          };
        }
      }

      // Weekly injection reminder
      const injectionDay = user['injectionDay'] ?? 1; // Mon=1
      const todayDow = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // convert to Mon=0..Sun=6
      if (todayDow === injectionDay) {
        const injDoc = await db.doc(`users/${userDoc.id}/injections/${todayISO}`).get();
        if (!injDoc.exists) {
          notification = {
            title: '💉 Giorno dell\'iniezione',
            body: 'È il tuo giorno di iniezione! Ricordati di registrarla.',
          };
        }
      }
    }

    // Evening notification
    const eveningHour = parseInt((user['notifyEveningTime'] || '21:00').split(':')[0]);
    if (userHour === eveningHour) {
      const logDoc = await db.doc(`users/${userDoc.id}/dailyLogs/${todayISO}`).get();
      const log = logDoc.data();
      if (!log?.['glucoseEvening']) {
        notification = {
          title: '🌙 Log serale',
          body: 'Hai completato il log? Ricorda glicemia serale, acqua e sonno.',
        };
      }
    }

    if (!notification) {
      results.skipped++;
      continue;
    }

    try {
      await messaging.send({
        token: user['fcmToken'],
        notification,
        webpush: {
          notification: { icon: '/icons/icon-192x192.png', badge: '/icons/icon-96x96.png' },
          fcmOptions: { link: '/daily-log' },
        },
      });
      results.sent++;
    } catch (err) {
      console.error(`FCM error for user ${userDoc.id}:`, err);
      results.errors++;
      // If token is invalid, remove it
      if ((err as { code?: string }).code === 'messaging/registration-token-not-registered') {
        await db.doc(`users/${userDoc.id}`).update({ fcmToken: null, notificationsEnabled: false });
      }
    }
  }

  return res.status(200).json(results);
}

function getLocalHour(utcDate: Date, timezone: string): number {
  try {
    return parseInt(
      new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).format(utcDate),
    );
  } catch {
    return utcDate.getUTCHours();
  }
}
