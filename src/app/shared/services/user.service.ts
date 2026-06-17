import { Injectable, inject } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, updateDoc, docData } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { UserProfile } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private firestore = inject(Firestore);

  getProfile(uid: string): Observable<UserProfile | undefined> {
    return docData(doc(this.firestore, `users/${uid}`)) as Observable<UserProfile | undefined>;
  }

  async createProfile(profile: UserProfile): Promise<void> {
    await setDoc(doc(this.firestore, `users/${profile.uid}`), profile);
  }

  async updateProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    await updateDoc(doc(this.firestore, `users/${uid}`), data as Record<string, unknown>);
  }

  async saveFcmToken(uid: string, token: string): Promise<void> {
    await updateDoc(doc(this.firestore, `users/${uid}`), { fcmToken: token });
  }
}
