import { Injectable, inject } from '@angular/core';
import { Firestore, doc, setDoc, docData, collection, collectionData, query, orderBy, limit } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Measurement } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class MeasurementService {
  private firestore = inject(Firestore);

  private path(uid: string, monthId: string): string {
    return `users/${uid}/measurements/${monthId}`;
  }

  getMeasurement(uid: string, monthId: string): Observable<Measurement | undefined> {
    return docData(doc(this.firestore, this.path(uid, monthId))) as Observable<Measurement | undefined>;
  }

  getRecentMeasurements(uid: string, count = 6): Observable<Measurement[]> {
    const ref = collection(this.firestore, `users/${uid}/measurements`);
    return collectionData(query(ref, orderBy('date', 'desc'), limit(count))) as Observable<Measurement[]>;
  }

  async saveMeasurement(uid: string, measurement: Measurement): Promise<void> {
    await setDoc(doc(this.firestore, this.path(uid, measurement.id)), measurement, { merge: true });
  }
}
