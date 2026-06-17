import { Injectable, inject } from '@angular/core';
import { Firestore, doc, setDoc, docData, collection, collectionData, query, orderBy, limit } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { DailyLog } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class DailyLogService {
  private firestore = inject(Firestore);

  private path(uid: string, date: string): string {
    return `users/${uid}/dailyLogs/${date}`;
  }

  getLog(uid: string, date: string): Observable<DailyLog | undefined> {
    return docData(doc(this.firestore, this.path(uid, date))) as Observable<DailyLog | undefined>;
  }

  getRecentLogs(uid: string, count = 30): Observable<DailyLog[]> {
    const ref = collection(this.firestore, `users/${uid}/dailyLogs`);
    return collectionData(query(ref, orderBy('date', 'desc'), limit(count))) as Observable<DailyLog[]>;
  }

  async saveLog(uid: string, log: DailyLog): Promise<void> {
    await setDoc(doc(this.firestore, this.path(uid, log.id)), log, { merge: true });
  }
}
