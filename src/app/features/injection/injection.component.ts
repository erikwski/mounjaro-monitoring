import { Component, inject, signal } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter, switchMap, map } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';
import { InjectionService } from '../../shared/services/injection.service';
import { UserService } from '../../shared/services/user.service';
import { Injection } from '../../core/models';
import { INJECTION_DAY_LABELS } from '../../core/models';

@Component({
  selector: 'app-injection',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatIconModule,
  ],
  templateUrl: './injection.component.html',
  styleUrl: './injection.component.scss',
})
export class InjectionComponent {
  private auth = inject(AuthService);
  private injectionService = inject(InjectionService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  today = new Date().toISOString().split('T')[0];
  currentWeek = this.getISOWeek(new Date());
  saving = signal(false);

  profile = toSignal(
    toObservable(this.auth.user).pipe(
      filter((u) => u != null),
      switchMap((u) => this.userService.getProfile(u!.uid)),
    ),
  );

  existingInjection = toSignal(
    toObservable(this.auth.user).pipe(
      filter((u) => u != null),
      switchMap((u) => this.injectionService.getInjection(u!.uid, this.today)),
    ),
  );

  form = this.fb.group({
    doseMg: [null as number | null, [Validators.required, Validators.min(0.5)]],
    notes: [''],
  });

  constructor() {
    toObservable(this.profile).pipe(filter((p) => p != null)).subscribe((p) => {
      if (p && this.form.get('doseMg')?.pristine) {
        this.form.patchValue({ doseMg: p.doseMg });
      }
    });
  }

  get injectionDayLabel(): string {
    const day = this.profile()?.injectionDay;
    return day != null ? INJECTION_DAY_LABELS[day] : '';
  }

  async save(): Promise<void> {
    const uid = this.auth.currentUid;
    if (!uid || this.form.invalid) return;
    this.saving.set(true);
    const injection: Injection = {
      id: this.today,
      date: this.today,
      weekNumber: this.currentWeek,
      doseMg: this.form.value.doseMg!,
      notes: this.form.value.notes || undefined,
    };
    try {
      await this.injectionService.saveInjection(uid, injection);
      this.snack.open('Iniezione registrata!', 'OK', { duration: 2000 });
    } finally {
      this.saving.set(false);
    }
  }

  private getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
