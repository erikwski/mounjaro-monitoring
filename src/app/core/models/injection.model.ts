export interface Injection {
  id: string; // YYYY-MM-DD (date of injection)
  date: string; // ISO date
  weekNumber: number;
  doseMg: number;
  notes?: string;
}
