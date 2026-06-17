import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import {
  Auth, GoogleAuthProvider, User,
  signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged,
} from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private _user = signal<User | null | undefined>(undefined);

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isLoading = computed(() => this._user() === undefined);

  constructor() {
    onAuthStateChanged(this.auth, (user) => this._user.set(user));
  }

  async signInWithGoogle(): Promise<void> {
    await signInWithRedirect(this.auth, new GoogleAuthProvider());
  }

  async handleRedirectResult(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const result = await getRedirectResult(this.auth);
      if (result?.user) this.router.navigate(['/dashboard']);
    } catch {
      // no pending redirect result
    }
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  get currentUid(): string | null {
    return this._user()?.uid ?? null;
  }
}
