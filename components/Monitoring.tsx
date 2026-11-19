'use client';
import { useMemo, useState } from 'react';
import type { Item, ListData } from '@/lib/types';
import { FILTERS, type Status } from '@/lib/status';
import { monthLabel } from '@/lib/format';
import Card from './Card';

type Props = {
  data: ListData | null;
  loading: boolean;
  error: string;
  onReload: () => void;
  onStatus: (item: Item, to: Status) => void;
  onForm: (item: Item, mode: 'create' | 'edit') => void;
  onDelete: (item: Item) => void;
};

export default function Monitoring({ data, loading, error, onReload, onStatus, onForm, onDelete }: Props) {
  const [filter, setFilter] = useState('all');
  const [month, setMonth] = useState('all');
  const [q, setQ] = useState('');

  const items = data?.items || [];

  // daftar bulan dari tanggal rapat, yang terbaru di atas
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
    FILTERS.forEach((f) => (o[f.id] = inMonth.filter((i) => f.test(i.status)).length));
    return o;
  }, [inMonth]);

  const shown = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter) || FILTERS[0];
    const needle = q.trim().toLowerCase();
    return inMonth
      .filter((i) => f.test(i.status))
      .filter((i) => !needle || (i.acara + ' ' + i.penyelenggara + ' ' + i.tempat).toLowerCase().includes(needle))
      // tanggal rapat terbaru di atas; yang tanpa tanggal di bawah
      .sort((a, b) => (b.tanggalIso || '').localeCompare(a.tanggalIso || '') || b.rowId - a.rowId);
  }, [inMonth, filter, q]);

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Monitoring Laporan Rapat Kesra</h1>
        <button className="ghost" onClick={onReload} disabled={loading}>{loading ? 'Memuat…' : 'Muat ulang'}</button>
      </div>

      {error && <div className="banner">{error}</div>}
      {(data?.warnings || []).map((w, i) => (
        <div className="banner" key={i}>{w}</div>
      ))}

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

      <div className="chips" role="tablist">
        {FILTERS.map((f) => (
          <button key={f.id} className={'chip' + (filter === f.id ? ' on' : '')} onClick={() => setFilter(f.id)}>
            {f.label} ({counts[f.id] ?? 0})
          </button>
        ))}
      </div>

      <div className="field">
        <label htmlFor="q" className="hint" style={{ fontWeight: 400 }}>Cari rapat</label>
        <input id="q" type="search" placeholder="Ketik nama acara atau tempat" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading && !data && <div className="center">Memuat data rapat…</div>}
      {!loading && data && shown.length === 0 && <div className="center">Tidak ada rapat di daftar ini.</div>}

      {shown.map((it) => (
        <Card key={it.rowId} item={it} onStatus={onStatus} onForm={onForm} onDelete={onDelete} />
      ))}
    </div>
  );
}
