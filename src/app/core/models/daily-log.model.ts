import { ActivityLevel } from './user.model';

export interface DailyLog {
  id: string; // YYYY-MM-DD
  date: string; // ISO date
  waterLiters?: number;
  sleepHours?: number;
  glucoseMorning?: number; // mg/dL
  glucoseEvening?: number; // mg/dL
  physicalActivity?: boolean;
  activityLevel?: ActivityLevel;
  stressLevel?: ActivityLevel;
  notes?: string;
}

export function isDailyLogComplete(log: DailyLog | null): boolean {
  if (!log) return false;
  return (
    log.waterLiters != null &&
    log.sleepHours != null &&
    log.glucoseMorning != null &&
    log.glucoseEvening != null
  );
}
