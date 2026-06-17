import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { filter, switchMap } from 'rxjs';
import { Messaging, getToken } from '@angular/fire/messaging';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';
import { UserService } from '../../shared/services/user.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatCardModule, MatSlideToggleModule, MatIconModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private messaging = inject(Messaging, { optional: true });
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);

  saving = signal(false);
  requestingNotif = signal(false);
  notifEnabled = signal(false);

  profile = toSignal(
    toObservable(this.auth.user).pipe(
      filter((u) => u != null),
      switchMap((u) => this.userService.getProfile(u!.uid)),
    ),
  );

  form = this.fb.group({
    notifyMorningTime: ['08:00'],
    notifyEveningTime: ['21:00'],
    doseMg: [null as number | null],
    targetWeightKg: [null as number | null],
  });

  constructor() {
    toObservable(this.profile).pipe(filter((p) => p != null)).subscribe((p) => {
      if (p) {
        this.form.patchValue({
          notifyMorningTime: p.notifyMorningTime,
          notifyEveningTime: p.notifyEveningTime,
          doseMg: p.doseMg,
          targetWeightKg: p.targetWeightKg,
        });
        this.notifEnabled.set(p.notificationsEnabled ?? false);
      }
    });
  }

  async enableNotifications(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.messaging) return;
    this.requestingNotif.set(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        this.snack.open('Notifiche non autorizzate', 'OK', { duration: 3000 });
        return;
      }
      const token = await getToken(this.messaging, { vapidKey: environment.firebase.vapidKey });
      const uid = this.auth.currentUid;
      if (uid && token) {
        await this.userService.saveFcmToken(uid, token);
        await this.userService.updateProfile(uid, { notificationsEnabled: true });
        this.notifEnabled.set(true);
        this.snack.open('Notifiche attivate!', 'OK', { duration: 2000 });
      }
    } catch {
      this.snack.open('Errore durante l\'attivazione', 'OK', { duration: 3000 });
    } finally {
      this.requestingNotif.set(false);
    }
  }

  async save(): Promise<void> {
    const uid = this.auth.currentUid;
    if (!uid) return;
    this.saving.set(true);
    const v = this.form.value;
    try {
      await this.userService.updateProfile(uid, {
        notifyMorningTime: v.notifyMorningTime ?? '08:00',
        notifyEveningTime: v.notifyEveningTime ?? '21:00',
        doseMg: v.doseMg ?? undefined,
        targetWeightKg: v.targetWeightKg ?? undefined,
      });
      this.snack.open('Impostazioni salvate!', 'OK', { duration: 2000 });
    } finally {
      this.saving.set(false);
    }
  }

  signOut(): void {
    this.auth.signOut();
  }
}
