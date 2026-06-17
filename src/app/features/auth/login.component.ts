import { Component, inject, signal, effect, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Mounjaro Monitor</mat-card-title>
          <mat-card-subtitle>Il tuo percorso, i tuoi risultati</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <p class="login-description">
            Monitora il tuo percorso con Mounjaro: peso, misure, glicemia e molto altro.
          </p>
        </mat-card-content>

        <mat-card-actions>
          @if (loading()) {
            <mat-spinner diameter="36" />
          } @else {
            <button mat-raised-button color="primary" (click)="signIn()">
              Accedi con Google
            </button>
          }
          @if (error()) {
            <p class="error-message">{{ error() }}</p>
          }
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 16px;
      background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
    }
    .login-card {
      max-width: 400px;
      width: 100%;
      padding: 24px;
      text-align: center;
    }
    mat-card-title { font-size: 1.8rem; font-weight: 500; margin-bottom: 8px; }
    .login-description { color: #555; margin: 16px 0; }
    button { width: 100%; display: flex; align-items: center; gap: 8px; justify-content: center; }
    .error-message { color: #c62828; margin-top: 12px; font-size: 0.875rem; }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    // Handle return from Google redirect (resolves with the signed-in user)
    this.auth.handleRedirectResult();

    // If already authenticated (persistent session or after redirect), go to dashboard
    effect(() => {
      const u = this.auth.user();
      if (u !== undefined && u !== null) {
        untracked(() => this.router.navigate(['/dashboard']));
      }
    });
  }

  async signIn(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.signInWithGoogle();
      // Page will redirect to Google — loading stays true until navigation away
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/unauthorized-domain') {
        this.error.set('Dominio non autorizzato. Aggiungi il sito ai domini autorizzati in Firebase Console.');
      } else {
        this.error.set(`Accesso fallito: ${code || 'errore sconosciuto'}`);
      }
      this.loading.set(false);
    }
  }
}
