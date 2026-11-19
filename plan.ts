import { REMINDER_DAYS } from './config';
import type { Plan } from './types';

export function todayIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// selisih hari: positif = rapat sudah lewat sekian hari
export function daysSince(iso: string, today = todayIso()): number {
  const a = new Date(iso + 'T00:00:00').getTime();
  const b = new Date(today + 'T00:00:00').getTime();
  return Math.round((b - a) / 86400000);
}

export type PlanState = 'selesai' | 'segera' | 'terlewat' | 'akan';

export function planState(p: Plan, today = todayIso()): { state: PlanState; days: number } {
  const days = p.tanggalIso ? daysSince(p.tanggalIso, today) : 0;
  if (p.linkLaporan) return { state: 'selesai', days };
  if (days < 0) return { state: 'akan', days };
  if (days <= REMINDER_DAYS) return { state: 'segera', days };
  return { state: 'terlewat', days };
}

export function dayLabel(days: number): string {
  if (days === 0) return 'Rapat hari ini';
  if (days > 0) return `H+${days}`;
  return `${-days} hari lagi`;
}
