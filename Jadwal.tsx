'use client';
import { useMemo, useState } from 'react';
import type { Plan } from '@/lib/types';
import { rpc } from '@/lib/client';
import { dayLabel, planState, todayIso } from '@/lib/plan';
import { fmtDate, monthLabel } from '@/lib/format';

type Props = {
  plans: Plan[];
  loading: boolean;
  onReload: () => void;
  onCreate: (p: Plan) => void;
  say: (text: string, bad?: boolean) => void;
};

const BLANK = { id: '', tanggalIso: '', rapat: '', pic: '' };

export default function Jadwal({ plans, loading, onReload, onCreate, say }: Props) {
  const thisMonth = todayIso().slice(0, 7);
  const [month, setMonth] = useState(thisMonth);
  const [edit, setEdit] = useState<typeof BLANK | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const months = useMemo(() => {
    const s = new Set<string>([thisMonth]);
    plans.forEach((p) => p.tanggalIso && s.add(p.tanggalIso.slice(0, 7)));
    return Array.from(s).sort().reverse();
  }, [plans, thisMonth]);

  const shown = useMemo(
    () => plans.filter((p) => p.tanggalIso.startsWith(month)).sort((a, b) => a.tanggalIso.localeCompare(b.tanggalIso)),
    [plans, month]
  );
  const done = shown.filter((p) => p.linkLaporan).length;

  async function submit() {
    if (!edit) return;
    if (!edit.tanggalIso || !edit.rapat.trim() || !edit.pic.trim()) {
      setErr('Tanggal, nama rapat, dan PIC wajib diisi.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await rpc('planSave', { id: edit.id || undefined, tanggalIso: edit.tanggalIso, rapat: edit.rapat.trim(), pic: edit.pic.trim() });
      setMonth(edit.tanggalIso.slice(0, 7));
      setEdit(null);
      say('Jadwal rapat tersimpan.');
      onReload();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function del(p: Plan) {
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
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Jadwal rapat &amp; PIC</h1>
        <button className="ghost" onClick={onReload} disabled={loading}>{loading ? 'Memuat…' : 'Muat ulang'}</button>
      </div>
      <p className="sub">Catat rapat dalam sebulan dan siapa PIC pembuat laporannya. Pengingat muncul di Monitoring.</p>

      <div className="field">
        <label htmlFor="jbulan">Bulan</label>
        <select id="jbulan" value={month} onChange={(e) => setMonth(e.target.value)}>
          {months.map((m) => (
            <option key={m} value={m}>{monthLabel(m)}</option>
          ))}
        </select>
        <div className="hint">{shown.length} rapat · {done} laporan sudah dibuat</div>
      </div>

      {!edit && (
        <button className="wide" style={{ marginBottom: 14 }} onClick={() => setEdit({ ...BLANK, tanggalIso: month === thisMonth ? todayIso() : month + '-01' })}>
          ➕ Tambah rapat ke jadwal
        </button>
      )}

      {edit && (
        <div className="card">
          <h3>{edit.id ? 'Ubah jadwal' : 'Rapat baru'}</h3>
          <div className="field">
            <label htmlFor="jt">Tanggal rapat</label>
            <input id="jt" type="date" value={edit.tanggalIso} onChange={(e) => setEdit({ ...edit, tanggalIso: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="jr">Nama rapat</label>
            <input id="jr" type="text" value={edit.rapat} onChange={(e) => setEdit({ ...edit, rapat: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="jp">PIC (pembuat laporan)</label>
            <input id="jp" type="text" value={edit.pic} onChange={(e) => setEdit({ ...edit, pic: e.target.value })} />
          </div>
          {err && <div className="err">{err}</div>}
          <div className="row" style={{ marginTop: 8 }}>
            <button className="ghost grow" onClick={() => { setEdit(null); setErr(''); }}>Batal</button>
            <button className="grow" onClick={submit} disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
          </div>
        </div>
      )}

      {!loading && shown.length === 0 && <div className="center">Belum ada rapat di bulan ini.</div>}

      {shown.map((p) => {
        const s = planState(p);
        const label = { selesai: 'Laporan sudah dibuat', segera: dayLabel(s.days) + ' · segera dibuat', terlewat: `Terlewat (H+${s.days})`, akan: dayLabel(s.days) }[s.state];
        return (
          <div className="card" key={p.id}>
            <h3>{p.rapat}</h3>
            <div className="meta">{fmtDate(p.tanggalIso)}</div>
            <div className="meta">PIC: <b>{p.pic}</b></div>
            <div style={{ margin: '8px 0' }}><span className={'tag ' + s.state}>{label}</span></div>
            <div className="row">
              {s.state !== 'selesai' && <button className="grow" onClick={() => onCreate(p)}>Buat laporan</button>}
              {p.linkLaporan && <a className="btn ghost grow" href={p.linkLaporan} target="_blank" rel="noreferrer">Buka PDF</a>}
              <button className="ghost" onClick={() => { setEdit({ id: p.id, tanggalIso: p.tanggalIso, rapat: p.rapat, pic: p.pic }); window.scrollTo({ top: 0 }); }}>Ubah</button>
              <button className="danger" onClick={() => del(p)}>Hapus</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
