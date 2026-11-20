'use client';
import { useMemo, useState } from 'react';
import type { Item, ListData, Plan } from '@/lib/types';
import { FILTERS, type Status } from '@/lib/status';
import { fmtDate, monthLabel } from '@/lib/format';
import { planState, todayIso } from '@/lib/plan';
import Card from './Card';
import Reminders from './Reminders';
import Icon from './Icon';

type Props = {
  data: ListData | null;
  loading: boolean;
  error: string;
  onReload: () => void;
  onStatus: (item: Item, to: Status) => void;
  onSpj: (item: Item, on: boolean) => void;
  onForm: (item: Item, mode: 'create' | 'edit') => void;
  onDelete: (item: Item) => void;
  onPlan: (p: Plan) => void;
};

const TILES: { id: string; label: string; cls: string }[] = [
  { id: 'act', label: 'Perlu tindakan', cls: 't-act' },
  { id: 'wait', label: 'Menunggu ACC', cls: 't-wait' },
  { id: 'arsip', label: 'Arsip selesai', cls: 't-ok' },
  { id: 'spj', label: 'SPJ lengkap ✓', cls: 't-spj' },
];

export default function Monitoring({ data, loading, error, onReload, onStatus, onSpj, onForm, onDelete, onPlan }: Props) {
  const [filter, setFilter] = useState('all');
  const [month, setMonth] = useState('all');
  const [q, setQ] = useState('');

  const items = data?.items || [];
  const picByLink = useMemo(() => {
    const m: Record<string, string> = {};
    (data?.plans || []).forEach((p) => p.linkLaporan && (m[p.linkLaporan] = p.pic));
    return m;
  }, [data]);

  const months = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.tanggalIso && s.add(i.tanggalIso.slice(0, 7)));
    return Array.from(s).sort().reverse();
  }, [items]);
  const hasNoDate = items.some((i) => !i.tanggalIso);

  const inMonth = useMemo(
    () =>
      items.filter((i) => {
        if (month === 'all') return true;
        if (month === 'none') return !i.tanggalIso;
        return i.tanggalIso.startsWith(month);
      }),
    [items, month]
  );

  const counts = useMemo(() => {
    const o: Record<string, number> = {};
    FILTERS.forEach((f) => (o[f.id] = inMonth.filter((i) => f.test(i)).length));
    return o;
  }, [inMonth]);

  const shown = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter) || FILTERS[0];
    const needle = q.trim().toLowerCase();
    return inMonth
      .filter((i) => f.test(i))
      .filter((i) => !needle || (i.acara + ' ' + i.penyelenggara + ' ' + i.tempat + ' ' + (picByLink[i.linkLaporan] || '')).toLowerCase().includes(needle))
      // tanggal rapat terbaru di atas; yang tanpa tanggal di bawah
      .sort((a, b) => (b.tanggalIso || '').localeCompare(a.tanggalIso || '') || b.rowId - a.rowId);
  }, [inMonth, filter, q, picByLink]);

  const hasHero = (data?.plans || []).some((p) => ['segera', 'terlewat'].includes(planState(p).state));
  const activeLabel = TILES.find((t) => t.id === filter)?.label;

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="eyebrow">✦ {fmtDate(todayIso())}</div>
          <h1>Monitoring Laporan Rapat Kesra</h1>
        </div>
        <button className="ghost" onClick={onReload} disabled={loading} aria-label="Muat ulang">
          <Icon name="refresh" /> {loading ? 'Memuat…' : 'Muat ulang'}
        </button>
      </div>

      {error && <div className="banner">{error}</div>}
      {(data?.warnings || []).map((w, i) => (
        <div className="banner" key={i}>{w}</div>
      ))}

      <div className={'bento' + (hasHero ? ' has-hero' : '')}>
      <Reminders plans={data?.plans || []} onCreate={onPlan} />

      <div className="tiles">
        {TILES.map((t) => (
          <button key={t.id} className={'tile ' + t.cls + (filter === t.id ? ' on' : '')} onClick={() => setFilter(filter === t.id ? 'all' : t.id)} aria-pressed={filter === t.id}>
            <span className="n">{counts[t.id] ?? 0}</span>
            <span className="l">{t.label}</span>
          </button>
        ))}
      </div>
      </div>
      {activeLabel && (
        <div className="activefilter">
          <span>Menampilkan: {activeLabel}</span>
          <button className="ghost" onClick={() => setFilter('all')}>Tampilkan semua ({counts.all ?? 0})</button>
        </div>
      )}

      <div className="filters">
        <div className="field">
          <label htmlFor="bulan">Bulan</label>
          <select id="bulan" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="all">Semua bulan</option>
            {months.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
            {hasNoDate && <option value="none">Tanpa tanggal</option>}
          </select>
        </div>
        <div className="field">
          <label htmlFor="q">Cari rapat</label>
          <input id="q" type="search" placeholder="Nama acara, tempat, atau PIC" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {loading && !data && <div className="center">Memuat data rapat…</div>}
      {!loading && data && shown.length === 0 && <div className="center">Tidak ada rapat di daftar ini.</div>}

      <div className="cards">
        {shown.map((it) => (
          <Card key={it.rowId} item={it} pic={picByLink[it.linkLaporan]} onStatus={onStatus} onSpj={onSpj} onForm={onForm} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
