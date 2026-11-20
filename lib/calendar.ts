import type { Item, Plan } from './types';
import { STATUS_META } from './status';

const p2 = (n: number) => String(n).padStart(2, '0');
export const isoOf = (y: number, m0: number, d: number) => `${y}-${p2(m0 + 1)}-${p2(d)}`;

// Kisi bulan, minggu mulai Senin. Sel kosong = null.
export function monthGrid(y: number, m0: number): (string | null)[] {
  const offset = (new Date(y, m0, 1).getDay() + 6) % 7;
  const n = new Date(y, m0 + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= n; d++) cells.push(isoOf(y, m0, d));
  while (cells.length % 7) cells.push(null);
  return cells;
}

export type DotTone = 'act' | 'wait' | 'info' | 'ok' | 'plan';

// Titik warna per tanggal: status rapat + jadwal yang laporannya belum dibuat.
export function dotsByDate(items: Item[], plans: Plan[]): Record<string, DotTone[]> {
  const o: Record<string, DotTone[]> = {};
  const add = (iso: string, t: DotTone) => {
    if (!iso) return;
    (o[iso] = o[iso] || []).push(t);
  };
  items.forEach((i) => add(i.tanggalIso, STATUS_META[i.status].tone));
  plans.filter((p) => !p.linkLaporan).forEach((p) => add(p.tanggalIso, 'plan'));
  return o;
}
