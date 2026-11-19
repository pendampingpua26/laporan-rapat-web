export const STATUSES = [
  'Belum Dibuat',
  'Laporan Dibuat',
  'Revisi Kasubkel',
  'ACC Kasubkel',
  'Revisi Kabid',
  'ACC Kabid',
  'Arsip',
  'SPJ',
] as const;
export type Status = (typeof STATUSES)[number];

export type Tone = 'ok' | 'wait' | 'act' | 'info';

export const STATUS_META: Record<Status, { icon: string; tone: Tone; stage: number }> = {
  'Belum Dibuat': { icon: '📝', tone: 'act', stage: 0 },
  'Laporan Dibuat': { icon: '⏳', tone: 'wait', stage: 1 },
  'Revisi Kasubkel': { icon: '✎', tone: 'act', stage: 1 },
  'ACC Kasubkel': { icon: '✔', tone: 'info', stage: 2 },
  'Revisi Kabid': { icon: '✎', tone: 'act', stage: 2 },
  'ACC Kabid': { icon: '✔', tone: 'info', stage: 3 },
  Arsip: { icon: '📁', tone: 'ok', stage: 4 },
  SPJ: { icon: '💰', tone: 'ok', stage: 4 },
};

export const STAGES = ['Dibuat', 'Kasubkel', 'Kabid', 'Arsip'];

// Tombol besar di kartu hanya untuk membuka form. Status diubah lewat satu pilihan di kartu.
export type NextAction = { label: string; to?: Status; form?: 'create' | 'edit' } | null;
export const NEXT: Record<Status, NextAction> = {
  'Belum Dibuat': { label: 'Buat laporan', form: 'create' },
  'Laporan Dibuat': null,
  'Revisi Kasubkel': { label: 'Edit laporan', form: 'edit' },
  'ACC Kasubkel': null,
  'Revisi Kabid': { label: 'Edit laporan', form: 'edit' },
  'ACC Kabid': null,
  Arsip: null,
  SPJ: null,
};

export const FILTERS: { id: string; label: string; test: (s: Status) => boolean }[] = [
  { id: 'all', label: 'Semua', test: () => true },
  { id: 'act', label: 'Perlu tindakan', test: (s) => ['Belum Dibuat', 'Revisi Kasubkel', 'Revisi Kabid', 'ACC Kabid'].includes(s) },
  { id: 'wait', label: 'Menunggu ACC', test: (s) => ['Laporan Dibuat', 'ACC Kasubkel'].includes(s) },
  { id: 'arsip', label: 'Arsip', test: (s) => s === 'Arsip' },
  { id: 'spj', label: 'SPJ', test: (s) => s === 'SPJ' },
];
