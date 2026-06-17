export interface Measurement {
  id: string; // YYYY-MM
  date: string; // ISO date
  weightKg: number;
  collo: number; // cm
  spalle: number;
  petto: number;
  sottoPetto: number;
  vita: number;
  addome: number;
  fianchi: number;
  coscia: number;
  braccio: number;
  notes?: string;
}

export const MEASUREMENT_LABELS: Partial<Record<keyof Measurement, string>> = {
  weightKg: 'Peso',
  collo: 'Collo',
  spalle: 'Spalle',
  petto: 'Petto',
  sottoPetto: 'Sotto Petto',
  vita: 'Vita',
  addome: 'Addome',
  fianchi: 'Fianchi',
  coscia: 'Coscia',
  braccio: 'Braccio',
};

export const BODY_MEASUREMENT_KEYS: (keyof Measurement)[] = [
  'collo', 'spalle', 'petto', 'sottoPetto', 'vita', 'addome', 'fianchi', 'coscia', 'braccio',
];
