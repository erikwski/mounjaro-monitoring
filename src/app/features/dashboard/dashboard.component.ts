import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, filter } from 'rxjs';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';
import { UserService } from '../../shared/services/user.service';
import { DailyLogService } from '../../shared/services/daily-log.service';
import { isDailyLogComplete } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private dailyLogService = inject(DailyLogService);

  today = new Date().toISOString().split('T')[0];
  currentWeek = this.getISOWeek(new Date());

  profile = toSignal(
    toObservable(this.auth.user).pipe(
      filter((u) => u != null),
      switchMap((u) => this.userService.getProfile(u!.uid)),
    ),
  );

  todayLog = toSignal(
    toObservable(this.auth.user).pipe(
      filter((u) => u != null),
      switchMap((u) => this.dailyLogService.getLog(u!.uid, this.today)),
    ),
  );

  logComplete = computed(() => isDailyLogComplete(this.todayLog() ?? null));

  daysSinceStart = computed(() => {
    const p = this.profile();
    if (!p?.therapyStartDate) return null;
    const start = new Date(p.therapyStartDate);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  });

  private getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
