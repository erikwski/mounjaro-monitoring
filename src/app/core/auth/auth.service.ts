import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, GoogleAuthProvider, User, signInWithPopup, signOut, onAuthStateChanged } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);

  private _user = signal<User | null | undefined>(undefined);

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isLoading = computed(() => this._user() === undefined);

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this._user.set(user);
    });
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  get currentUid(): string | null {
    return this._user()?.uid ?? null;
  }
}
