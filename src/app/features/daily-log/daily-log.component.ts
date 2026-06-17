import { Component, inject, signal } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { filter, switchMap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';
import { DailyLogService } from '../../shared/services/daily-log.service';
import { DailyLog } from '../../core/models';

@Component({
  selector: 'app-daily-log',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatCardModule, MatSliderModule, MatSelectModule, MatIconModule,
  ],
  templateUrl: './daily-log.component.html',
  styleUrl: './daily-log.component.scss',
})
export class DailyLogComponent {
  private auth = inject(AuthService);
  private dailyLogService = inject(DailyLogService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  today = new Date().toISOString().split('T')[0];
  saving = signal(false);

  existingLog = toSignal(
    toObservable(this.auth.user).pipe(
      filter((u) => u != null),
      switchMap((u) => this.dailyLogService.getLog(u!.uid, this.today)),
    ),
  );

  form = this.fb.group({
    glucoseMorning: [null as number | null],
    glucoseEvening: [null as number | null],
    waterLiters: [null as number | null],
    sleepHours: [null as number | null],
    physicalActivity: [false],
    activityLevel: [null as string | null],
    stressLevel: [null as string | null],
    notes: [''],
  });

  constructor() {
    toObservable(this.existingLog).pipe(filter((l) => l !== undefined)).subscribe((log) => {
      if (log) this.form.patchValue(log as unknown as Record<string, unknown>);
    });
  }

  async save(): Promise<void> {
    const uid = this.auth.currentUid;
    if (!uid) return;
    this.saving.set(true);
    const v = this.form.value;
    const log: DailyLog = {
      id: this.today,
      date: this.today,
      waterLiters: v.waterLiters ?? undefined,
      sleepHours: v.sleepHours ?? undefined,
      glucoseMorning: v.glucoseMorning ?? undefined,
      glucoseEvening: v.glucoseEvening ?? undefined,
      physicalActivity: v.physicalActivity ?? undefined,
      activityLevel: (v.activityLevel as DailyLog['activityLevel']) ?? undefined,
      stressLevel: (v.stressLevel as DailyLog['stressLevel']) ?? undefined,
      notes: v.notes || undefined,
    };
    try {
      await this.dailyLogService.saveLog(uid, log);
      this.snack.open('Log salvato!', 'OK', { duration: 2000 });
    } finally {
      this.saving.set(false);
    }
  }
}
