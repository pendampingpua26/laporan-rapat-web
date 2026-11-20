'use client';
import { useMemo, useState } from 'react';
import type { Item, Plan } from '@/lib/types';
import type { Status } from '@/lib/status';
import { rpc } from '@/lib/client';
import { dayLabel, planState, todayIso } from '@/lib/plan';
import { fmtDate, monthLabel } from '@/lib/format';
import { dotsByDate, monthGrid } from '@/lib/calendar';
import Card from './Card';
import Icon from './Icon';

type Props = {
  items: Item[];
  plans: Plan[];
  loading: boolean;
  onReload: () => void;
  onStatus: (item: Item, to: Status) => void;
  onSpj: (item: Item, on: boolean) => void;
  onForm: (item: Item, mode: 'create' | 'edit') => void;
  onDelete: (item: Item) => void;
  onPlan: (p: Plan) => void;
  say: (text: string, bad?: boolean) => void;
};

type Draft = { id: string; tanggalIso: string; rapat: string; pic: string };
const WD = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function Kalender({ items, plans, loading, onReload, onStatus, onSpj, onForm, onDelete, onPlan, say }: Props) {
  const today = todayIso();
  const [y, setY] = useState(Number(today.slice(0, 4)));
  const [m0, setM0] = useState(Number(today.slice(5, 7)) - 1);
  const [sel, setSel] = useState(today);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const cells = useMemo(() => monthGrid(y, m0), [y, m0]);
  const dots = useMemo(() => dotsByDate(items, plans), [items, plans]);
  const picByLink = useMemo(() => {
    const m: Record<string, string> = {};
    plans.forEach((p) => p.linkLaporan && (m[p.linkLaporan] = p.pic));
    return m;
  }, [plans]);

  const ym = `${y}-${String(m0 + 1).padStart(2, '0')}`;
  const monthItems = items.filter((i) => i.tanggalIso.startsWith(ym)).length;
  const monthPending = plans.filter((p) => !p.linkLaporan && p.tanggalIso.startsWith(ym)).length;

  const dayItems = items.filter((i) => i.tanggalIso === sel);
  const dayPlans = plans.filter((p) => !p.linkLaporan && p.tanggalIso === sel);
  const late = plans.filter((p) => planState(p).state === 'terlewat').sort((a, b) => b.tanggalIso.localeCompare(a.tanggalIso));

  function go(delta: number) {
    const d = new Date(y, m0 + delta, 1);
    setY(d.getFullYear());
    setM0(d.getMonth());
  }
  function pick(iso: string) {
    setSel(iso);
    setDraft(null);
  }
  function jumpTo(iso: string) {
    setY(Number(iso.slice(0, 4)));
    setM0(Number(iso.slice(5, 7)) - 1);
    pick(iso);
  }

  async function submit() {
    if (!draft) return;
    if (!draft.tanggalIso || !draft.rapat.trim() || !draft.pic.trim()) {
      setErr('Tanggal, nama rapat, dan PIC wajib diisi.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await rpc('planSave', { id: draft.id || undefined, tanggalIso: draft.tanggalIso, rapat: draft.rapat.trim(), pic: draft.pic.trim() });
      jumpTo(draft.tanggalIso);
      setDraft(null);
      say('Jadwal rapat tersimpan.');
      onReload();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function delPlan(p: Plan) {
    if (!window.confirm(`Hapus “${p.rapat}” dari jadwal?\n\nLaporan yang sudah dibuat tidak ikut terhapus.`)) return;
    try {
      await rpc('planRemove', { id: p.id });
      say('Jadwal dihapus.');
      onReload();
    } catch (e: any) {
      say('Gagal menghapus: ' + e.message, true);
    }
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="eyebrow">✦ Jadwal rapat &amp; PIC</div>
          <h1>Kalender rapat</h1>
        </div>
        <button className="ghost" onClick={onReload} disabled={loading} aria-label="Muat ulang">
          <Icon name="refresh" /> {loading ? 'Memuat…' : 'Muat ulang'}
        </button>
      </div>
      <p className="sub">Ketuk tanggal untuk melihat rapat dan laporannya. {monthItems + monthPending} rapat di {monthLabel(ym)}.</p>

      <div className="cal">
        <div className="calhead">
          <button className="ghost" onClick={() => go(-1)} aria-label="Bulan sebelumnya"><Icon name="left" /></button>
          <h2>{monthLabel(ym)}</h2>
          <button className="ghost" onClick={() => go(1)} aria-label="Bulan berikutnya"><Icon name="right" /></button>
        </div>
        <div className="wd">{WD.map((w) => <span key={w}>{w}</span>)}</div>
        <div className="days">
          {cells.map((iso, i) =>
            iso ? (
              <button
                key={iso}
                className={'day' + (iso === sel ? ' sel' : '') + (iso === today ? ' today' : '')}
                onClick={() => pick(iso)}
                aria-label={fmtDate(iso) + (dots[iso] ? `, ${dots[iso].length} rapat` : '')}
                aria-pressed={iso === sel}
              >
                {Number(iso.slice(8))}
                <span className="dots">
                  {(dots[iso] || []).slice(0, 3).map((t, k) => <span key={k} className={'d ' + t} />)}
                </span>
              </button>
            ) : (
              <div key={'b' + i} className="blank" />
            )
          )}
        </div>
        <div className="legend">
          <span><i className="d act" /> perlu tindakan</span>
          <span><i className="d wait" /> menunggu ACC</span>
          <span><i className="d info" /> sudah ACC</span>
          <span><i className="d ok" /> arsip</span>
          <span><i className="d plan" /> jadwal, laporan belum dibuat</span>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="ghost" onClick={() => jumpTo(today)}>Hari ini</button>
        </div>
      </div>

      <div className="dayhead">
        <h2>{fmtDate(sel)}</h2>
        {!draft && (
          <button onClick={() => { setDraft({ id: '', tanggalIso: sel, rapat: '', pic: '' }); setErr(''); }}>
            <Icon name="plus" /> Tambah rapat
          </button>
        )}
      </div>

      {draft && (
        <div className="card">
          <h3>{draft.id ? 'Ubah jadwal' : 'Rapat baru di jadwal'}</h3>
          <div className="field">
            <label htmlFor="jt">Tanggal rapat</label>
            <input id="jt" type="date" value={draft.tanggalIso} onChange={(e) => setDraft({ ...draft, tanggalIso: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="jr">Nama rapat</label>
            <input id="jr" type="text" value={draft.rapat} onChange={(e) => setDraft({ ...draft, rapat: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="jp">PIC (pembuat laporan)</label>
            <input id="jp" type="text" value={draft.pic} onChange={(e) => setDraft({ ...draft, pic: e.target.value })} />
          </div>
          {err && <div className="err">{err}</div>}
          <div className="row" style={{ marginTop: 8 }}>
            <button className="ghost grow" onClick={() => { setDraft(null); setErr(''); }}>Batal</button>
            <button className="grow" onClick={submit} disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
          </div>
        </div>
      )}

      {!loading && !dayItems.length && !dayPlans.length && !draft && <div className="center">Tidak ada rapat di tanggal ini.</div>}

      {dayPlans.map((p) => {
        const s = planState(p, today);
        const label = s.state === 'terlewat' ? `Terlewat (H+${s.days})` : s.state === 'segera' ? dayLabel(s.days) + ' · segera dibuat' : dayLabel(s.days);
        return (
          <div className="card" key={p.id}>
            <h3>{p.rapat}</h3>
            <div className="meta">PIC: <b>{p.pic}</b></div>
            <div style={{ margin: '8px 0' }}><span className={'tag ' + (s.state === 'selesai' ? 'selesai' : s.state)}>{label}</span><span className="meta">Laporan belum dibuat</span></div>
            <div className="row">
              <button className="grow" onClick={() => onPlan(p)}>Buat laporan</button>
              <button className="ghost" onClick={() => { setDraft({ id: p.id, tanggalIso: p.tanggalIso, rapat: p.rapat, pic: p.pic }); setErr(''); }}>Ubah</button>
              <button className="danger" onClick={() => delPlan(p)}>Hapus</button>
            </div>
          </div>
        );
      })}

      <div className="cards">
        {dayItems.map((it) => (
          <Card key={it.rowId} item={it} pic={picByLink[it.linkLaporan]} onStatus={onStatus} onSpj={onSpj} onForm={onForm} onDelete={onDelete} />
        ))}
      </div>

      {late.length > 0 && (
        <div className="late">
          <b>Terlewat, laporan belum dibuat ({late.length})</b>
          {late.slice(0, 5).map((p) => (
            <div className="it" key={p.id}>
              <div style={{ minWidth: 0 }}>
                <b>{p.rapat}</b>
                <span className="meta">PIC: {p.pic} · {fmtDate(p.tanggalIso)}</span>
              </div>
              <button className="ghost" onClick={() => jumpTo(p.tanggalIso)}>Buka</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
