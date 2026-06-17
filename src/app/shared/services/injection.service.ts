import { Injectable, inject } from '@angular/core';
import { Firestore, doc, setDoc, docData, collection, collectionData, query, orderBy, limit } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Injection } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class InjectionService {
  private firestore = inject(Firestore);

  private path(uid: string, date: string): string {
    return `users/${uid}/injections/${date}`;
  }

  getInjection(uid: string, date: string): Observable<Injection | undefined> {
    return docData(doc(this.firestore, this.path(uid, date))) as Observable<Injection | undefined>;
  }

  getRecentInjections(uid: string, count = 12): Observable<Injection[]> {
    const ref = collection(this.firestore, `users/${uid}/injections`);
    return collectionData(query(ref, orderBy('date', 'desc'), limit(count))) as Observable<Injection[]>;
  }

  async saveInjection(uid: string, injection: Injection): Promise<void> {
    await setDoc(doc(this.firestore, this.path(uid, injection.id)), injection, { merge: true });
  }
}
