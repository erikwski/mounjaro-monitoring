import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';
import { UserService } from '../../shared/services/user.service';
import { MeasurementService } from '../../shared/services/measurement.service';
import { UserProfile, Measurement, InjectionDay, INJECTION_DAY_LABELS } from '../../core/models';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatStepperModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatRadioModule, MatCheckboxModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private measurementService = inject(MeasurementService);
  private router = inject(Router);

  saving = signal(false);
  injectionDays = Object.entries(INJECTION_DAY_LABELS) as [string, string][];

  profileForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    heightCm: [null as number | null, [Validators.required, Validators.min(100), Validators.max(250)]],
    sex: ['F' as 'F' | 'M', Validators.required],
    birthDate: [null as Date | null, Validators.required],
  });

  therapyForm = this.fb.group({
    injectionDay: [1 as InjectionDay, Validators.required],
    doseMg: [2.5, [Validators.required, Validators.min(0.5)]],
    therapyStartDate: [null as Date | null, Validators.required],
    targetWeightKg: [null as number | null, [Validators.required, Validators.min(30)]],
    targetDate: [null as Date | null, Validators.required],
  });

  measurementsForm = this.fb.group({
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
  });

  habitsForm = this.fb.group({
    smoker: [false],
    alcohol: [false],
    dietQuality: ['equilibrata' as 'equilibrata' | 'poco_equilibrata'],
  });

  async complete(): Promise<void> {
    const uid = this.auth.currentUid;
    if (!uid) return;

    this.saving.set(true);
    const p = this.profileForm.value;
    const t = this.therapyForm.value;
    const m = this.measurementsForm.value;
    const h = this.habitsForm.value;
    const now = new Date().toISOString();

    const profile: UserProfile = {
      uid,
      firstName: p.firstName!,
      lastName: p.lastName!,
      heightCm: p.heightCm!,
      sex: p.sex!,
      birthDate: (p.birthDate as Date).toISOString().split('T')[0],
      smoker: h.smoker ?? false,
      alcohol: h.alcohol ?? false,
      dietQuality: h.dietQuality ?? 'equilibrata',
      injectionDay: t.injectionDay!,
      doseMg: t.doseMg!,
      therapyStartDate: (t.therapyStartDate as Date).toISOString().split('T')[0],
      targetWeightKg: t.targetWeightKg!,
      targetDate: (t.targetDate as Date).toISOString().split('T')[0],
      fcmToken: undefined,
      notificationsEnabled: false,
      notifyMorningTime: '08:00',
      notifyEveningTime: '21:00',
      notifyTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      onboardingComplete: true,
      createdAt: now,
    };

    const monthId = now.slice(0, 7);
    const measurement: Measurement = {
      id: monthId,
      date: now.split('T')[0],
      weightKg: m.weightKg!,
      collo: m.collo!, spalle: m.spalle!, petto: m.petto!,
      sottoPetto: m.sottoPetto!, vita: m.vita!, addome: m.addome!,
      fianchi: m.fianchi!, coscia: m.coscia!, braccio: m.braccio!,
    };

    try {
      await this.userService.createProfile(profile);
      await this.measurementService.saveMeasurement(uid, measurement);
      this.router.navigate(['/dashboard']);
    } finally {
      this.saving.set(false);
    }
  }
}
