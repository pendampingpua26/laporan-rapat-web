'use client';
import { useMemo, useState } from 'react';
import type { Item, ListData } from '@/lib/types';
import { FILTERS, STATUS_META, type Status } from '@/lib/status';
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
  const [q, setQ] = useState('');

  const items = data?.items || [];
  const counts = useMemo(() => {
    const o: Record<string, number> = {};
    FILTERS.forEach((f) => (o[f.id] = items.filter((i) => f.test(i.status)).length));
    return o;
  }, [items]);

  const shown = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter) || FILTERS[0];
    const needle = q.trim().toLowerCase();
    return items
      .filter((i) => f.test(i.status))
      .filter((i) => !needle || (i.acara + ' ' + i.penyelenggara + ' ' + i.tempat).toLowerCase().includes(needle))
      .sort((a, b) => {
        const pa = STATUS_META[a.status].tone === 'act' ? 0 : 1;
        const pb = STATUS_META[b.status].tone === 'act' ? 0 : 1;
        if (pa !== pb) return pa - pb;
        return (b.tanggalIso || '').localeCompare(a.tanggalIso || '');
      });
  }, [items, filter, q]);

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Monitoring laporan</h1>
        <button className="ghost" onClick={onReload} disabled={loading}>{loading ? 'Memuat…' : 'Muat ulang'}</button>
      </div>

      {error && <div className="banner">{error}</div>}

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
