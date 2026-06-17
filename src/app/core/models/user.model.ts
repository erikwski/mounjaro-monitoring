export type Sex = 'F' | 'M';
export type DietQuality = 'equilibrata' | 'poco_equilibrata';
export type ActivityLevel = 'basso' | 'medio' | 'alto';
export type InjectionDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Lun … 6=Dom

export const INJECTION_DAY_LABELS: Record<InjectionDay, string> = {
  0: 'Lunedì',
  1: 'Martedì',
  2: 'Mercoledì',
  3: 'Giovedì',
  4: 'Venerdì',
  5: 'Sabato',
  6: 'Domenica',
};

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  heightCm: number;
  sex: Sex;
  birthDate: string; // ISO date
  smoker: boolean;
  alcohol: boolean;
  dietQuality: DietQuality;
  // Therapy
  injectionDay: InjectionDay;
  doseMg: number;
  therapyStartDate: string; // ISO date
  // Goal
  targetWeightKg: number;
  targetDate: string; // ISO date
  // Notifications
  fcmToken?: string;
  notificationsEnabled: boolean;
  notifyMorningTime: string; // 'HH:mm'
  notifyEveningTime: string; // 'HH:mm'
  notifyTimezone: string;
  // App state
  onboardingComplete: boolean;
  createdAt: string; // ISO datetime
}
