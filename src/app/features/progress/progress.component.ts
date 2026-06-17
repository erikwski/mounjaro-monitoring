import { Component, inject, computed } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../core/auth/auth.service';
import { MeasurementService } from '../../shared/services/measurement.service';
import { DailyLogService } from '../../shared/services/daily-log.service';
import { Measurement, DailyLog } from '../../core/models';
import type { EChartsOption } from 'echarts';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [NgxEchartsDirective, MatTabsModule, MatCardModule],
  providers: [
    provideEchartsCore({ echarts: () => import('echarts') }),
  ],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss',
})
export class ProgressComponent {
  private auth = inject(AuthService);
  private measurementService = inject(MeasurementService);
  private dailyLogService = inject(DailyLogService);

  measurements = toSignal(
    toObservable(this.auth.user).pipe(
      filter((u) => u != null),
      switchMap((u) => this.measurementService.getRecentMeasurements(u!.uid, 12)),
    ),
    { initialValue: [] as Measurement[] },
  );

  recentLogs = toSignal(
    toObservable(this.auth.user).pipe(
      filter((u) => u != null),
      switchMap((u) => this.dailyLogService.getRecentLogs(u!.uid, 30)),
    ),
    { initialValue: [] as DailyLog[] },
  );

  weightChartOption = computed<EChartsOption>(() => {
    const data = [...this.measurements()].reverse();
    return {
      title: { text: 'Peso nel tempo', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: data.map((m) => m.id) },
      yAxis: { type: 'value', name: 'kg', scale: true },
      series: [{ type: 'line', data: data.map((m) => m.weightKg), smooth: true, lineStyle: { color: '#00838f' }, itemStyle: { color: '#00838f' } }],
    };
  });

  glucoseChartOption = computed<EChartsOption>(() => {
    const data = [...this.recentLogs()].reverse();
    return {
      title: { text: 'Glicemia (mg/dL)', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, data: ['Mattina', 'Sera'] },
      xAxis: { type: 'category', data: data.map((l) => l.date) },
      yAxis: { type: 'value', name: 'mg/dL', scale: true },
      series: [
        { name: 'Mattina', type: 'line', data: data.map((l) => l.glucoseMorning ?? null), smooth: true, lineStyle: { color: '#ff9800' }, itemStyle: { color: '#ff9800' } },
        { name: 'Sera', type: 'line', data: data.map((l) => l.glucoseEvening ?? null), smooth: true, lineStyle: { color: '#9c27b0' }, itemStyle: { color: '#9c27b0' } },
      ],
    };
  });

  measurementsRadarOption = computed<EChartsOption>(() => {
    const data = [...this.measurements()].reverse();
    if (data.length < 2) return {};
    const first = data[0];
    const last = data[data.length - 1];
    const keys = ['vita', 'addome', 'fianchi', 'petto', 'coscia', 'braccio'] as const;
    const asMeasurementRecord = (m: Measurement) => m as unknown as Record<string, number>;
    return {
      title: { text: 'Misure: prima vs dopo', left: 'center' },
      tooltip: {},
      legend: { bottom: 0, data: [first.id, last.id] },
      radar: {
        indicator: keys.map((k) => ({
          name: k.charAt(0).toUpperCase() + k.slice(1),
          max: Math.max(...data.map((m) => asMeasurementRecord(m)[k])) + 5,
        })),
      },
      series: [{
        type: 'radar',
        data: [
          { name: first.id, value: keys.map((k) => asMeasurementRecord(first)[k]) },
          { name: last.id, value: keys.map((k) => asMeasurementRecord(last)[k]) },
        ],
      }],
    };
  });
}
