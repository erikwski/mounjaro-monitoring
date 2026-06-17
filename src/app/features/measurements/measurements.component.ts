import { Component, inject, signal } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter, switchMap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';
import { MeasurementService } from '../../shared/services/measurement.service';
import { Measurement, MEASUREMENT_LABELS, BODY_MEASUREMENT_KEYS } from '../../core/models';

@Component({
  selector: 'app-measurements',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatCardModule, MatIconModule, MatTabsModule,
  ],
  templateUrl: './measurements.component.html',
  styleUrl: './measurements.component.scss',
})
export class MeasurementsComponent {
  private auth = inject(AuthService);
  private measurementService = inject(MeasurementService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  today = new Date().toISOString().split('T')[0];
  currentMonth = new Date().toISOString().slice(0, 7);
  saving = signal(false);
  measurementLabels = MEASUREMENT_LABELS;
  bodyKeys = BODY_MEASUREMENT_KEYS;

  currentMeasurement = toSignal(
    toObservable(this.auth.user).pipe(
      filter((u) => u != null),
      switchMap((u) => this.measurementService.getMeasurement(u!.uid, this.currentMonth)),
    ),
  );

  history = toSignal(
    toObservable(this.auth.user).pipe(
      filter((u) => u != null),
      switchMap((u) => this.measurementService.getRecentMeasurements(u!.uid, 6)),
    ),
    { initialValue: [] as Measurement[] },
  );

  form = this.fb.group({
    weightKg: [null as number | null, [Validators.required, Validators.min(30)]],
    collo: [null as number | null, Validators.required],
    spalle: [null as number | null, Validators.required],
    petto: [null as number | null, Validators.required],
    sottoPetto: [null as number | null, Validators.required],
    vita: [null as number | null, Validators.required],
    addome: [null as number | null, Validators.required],
    fianchi: [null as number | null, Validators.required],
    coscia: [null as number | null, Validators.required],
    braccio: [null as number | null, Validators.required],
    notes: [''],
  });

  constructor() {
    toObservable(this.currentMeasurement).pipe(filter((m) => m !== undefined)).subscribe((m) => {
      if (m) this.form.patchValue(m as unknown as Record<string, unknown>);
    });
  }

  async save(): Promise<void> {
    const uid = this.auth.currentUid;
    if (!uid || this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.value;
    const measurement: Measurement = {
      id: this.currentMonth,
      date: this.today,
      weightKg: v.weightKg!,
      collo: v.collo!, spalle: v.spalle!, petto: v.petto!,
      sottoPetto: v.sottoPetto!, vita: v.vita!, addome: v.addome!,
      fianchi: v.fianchi!, coscia: v.coscia!, braccio: v.braccio!,
      notes: v.notes || undefined,
    };
    try {
      await this.measurementService.saveMeasurement(uid, measurement);
      this.snack.open('Misure salvate!', 'OK', { duration: 2000 });
    } finally {
      this.saving.set(false);
    }
  }
}
