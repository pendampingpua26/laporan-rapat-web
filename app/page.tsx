'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Login from '@/components/Login';
import Monitoring from '@/components/Monitoring';
import Wizard from '@/components/Wizard';
import DriveLinks from '@/components/DriveLinks';
import Kalender from '@/components/Kalender';
import Icon from '@/components/Icon';
import { rpc } from '@/lib/client';
import type { Item, ListData, Plan } from '@/lib/types';
import type { Status } from '@/lib/status';

type View = 'monitor' | 'kalender' | 'form' | 'drive';
type FormTarget = { mode: 'create' | 'edit'; item?: Item; plan?: Plan; draftId: string };
type Toast = { text: string; bad?: boolean; undo?: () => void } | null;

export default function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [view, setView] = useState<View>('monitor');
  const [target, setTarget] = useState<FormTarget | null>(null);
  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<Toast>(null);
  const timer = useRef<any>(null);

  const say = useCallback((t: Toast, ms = 6000) => {
    setToast(t);
    clearTimeout(timer.current);
    if (t) timer.current = setTimeout(() => setToast(null), ms);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await rpc<ListData>('list'));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/auth')
      .then((r) => r.json())
      .then((j) => setAuthed(!!j.ok))
      .catch(() => setAuthed(false));
    const out = () => setAuthed(false);
    window.addEventListener('lr-logout', out);
    return () => window.removeEventListener('lr-logout', out);
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  async function changeStatus(item: Item, to: Status) {
    if (to === item.status) return;
    const before = item.status;
    const patch = (st: Status) =>
      setData((d) => (d ? { ...d, items: d.items.map((i) => (i.rowId === item.rowId ? { ...i, status: st } : i)) } : d));
    patch(to);
    try {
      await rpc('setStatus', { rowId: item.rowId, status: to });
      say({
        text: `Status diubah menjadi “${to}”.`,
        undo: async () => {
          patch(before);
          say(null);
          try {
            await rpc('setStatus', { rowId: item.rowId, status: before });
          } catch (e: any) {
            patch(to);
            say({ text: 'Gagal membatalkan: ' + e.message, bad: true });
          }
        },
      });
    } catch (e: any) {
      patch(before);
      say({ text: 'Status gagal diubah: ' + e.message, bad: true }, 9000);
    }
  }

  async function changeSpj(item: Item, on: boolean) {
    const patch = (v: boolean) =>
      setData((d) => (d ? { ...d, items: d.items.map((i) => (i.rowId === item.rowId ? { ...i, spj: v } : i)) } : d));
    patch(on);
    try {
      await rpc('setSpj', { rowId: item.rowId, spj: on });
      say({ text: on ? 'SPJ dicentang.' : 'Centang SPJ dilepas.' });
    } catch (e: any) {
      patch(!on);
      say({ text: 'SPJ gagal diubah: ' + e.message, bad: true }, 9000);
    }
  }

  async function changePic(item: Item, pic: string) {
    const patch = (v: string) =>
      setData((d) => (d ? { ...d, items: d.items.map((i) => (i.rowId === item.rowId ? { ...i, pic: v } : i)) } : d));
    const before = item.pic;
    patch(pic);
    try {
      await rpc('setPic', { rowId: item.rowId, pic });
      say({ text: 'Penerima Disposisi disimpan.' });
    } catch (e: any) {
      patch(before);
      say({ text: 'Penerima Disposisi gagal disimpan: ' + e.message, bad: true }, 9000);
    }
  }

  function openForm(item: Item, mode: 'create' | 'edit') {
    setTarget({ mode, item, draftId: mode === 'edit' ? 'edit-' + item.key : 'mon-' + item.rowId });
    setView('form');
    window.scrollTo({ top: 0 });
  }

  function openFromPlan(plan: Plan) {
    setTarget({ mode: 'create', plan, draftId: 'plan-' + plan.id });
    setView('form');
    window.scrollTo({ top: 0 });
  }

  function newBlank() {
    setTarget({ mode: 'create', draftId: 'baru' });
    setView('form');
    window.scrollTo({ top: 0 });
  }

  async function del(item: Item) {
    if (!window.confirm(`Hapus “${item.acara}”?\n\nRapat ini hilang dari daftar dan dari spreadsheet monitoring. Dokumen dan PDF dipindah ke sampah Drive. Tidak bisa dibatalkan.`)) return;
    try {
      await rpc('remove', { key: item.key, rowId: item.rowId });
      // langsung hilang dari layar tanpa menunggu muat ulang
      setData((d) => (d ? { ...d, items: d.items.filter((i) => i.rowId !== item.rowId) } : d));
      say({ text: 'Terhapus dari daftar dan spreadsheet monitoring.' });
      load();
    } catch (e: any) {
      say({ text: 'Gagal menghapus: ' + e.message, bad: true }, 9000);
    }
  }

  function closeForm() {
    setView('monitor');
    setTarget(null);
    window.scrollTo({ top: 0 });
  }

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' });
    setAuthed(false);
  }

  if (authed === null) return <div className="center">Memuat…</div>;
  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  const initial: Record<string, string> = {};
  if (target?.plan) {
    initial['Acara'] = target.plan.rapat;
    if (target.plan.pic) initial['Penerima Disposisi'] = target.plan.pic;
    if (target.plan.tanggalIso) initial['Hari/Tanggal Pelaksanaan Rapat'] = target.plan.tanggalIso;
  }
  if (target?.item) {
    const it = target.item;
    if (it.acara) initial['Acara'] = it.acara;
    if (it.tanggalIso) initial['Hari/Tanggal Pelaksanaan Rapat'] = it.tanggalIso;
    if (it.tempat) initial['Tempat Rapat'] = it.tempat;
    if (it.penyelenggara) initial['Penyelenggara Rapat'] = it.penyelenggara;
    const pp = it.pic || (data?.plans || []).find((p) => p.linkLaporan && p.linkLaporan === it.linkLaporan)?.pic;
    if (pp) initial['Penerima Disposisi'] = pp;
  }

  return (
    <div className="shell">
      <div className="wrap">
        {view === 'monitor' && (
          <Monitoring data={data} loading={loading} error={error} onReload={load} onStatus={changeStatus} onSpj={changeSpj} onPic={changePic} onForm={openForm} onDelete={del} onPlan={openFromPlan} />
        )}
        {view === 'form' && target && (
          <div className="narrow">
          <Wizard
            key={target.draftId}
            mode={target.mode}
            editKey={target.item?.key}
            monRowId={target.item?.rowId}
            planId={target.plan?.id}
            initial={initial}
            draftId={target.draftId}
            onClose={closeForm}
            onSaved={load}
          />
          </div>
        )}
        {view === 'kalender' && (
          <Kalender
            items={data?.items || []}
            plans={data?.plans || []}
            loading={loading}
            onReload={load}
            onStatus={changeStatus}
            onSpj={changeSpj}
            onPic={changePic}
            onForm={openForm}
            onDelete={del}
            onPlan={openFromPlan}
            say={(text, bad) => say({ text, bad })}
          />
        )}
        {view === 'drive' && <div className="narrow"><DriveLinks data={data} loading={loading} /></div>}
        {view === 'monitor' && (
          <p style={{ textAlign: 'center', marginTop: 24 }}>
            <button className="ghost" onClick={logout}>Keluar</button>
          </p>
        )}
      </div>

      {toast && (
        <div className={'toast' + (toast.bad ? ' bad' : '')} role="status">
          <span>{toast.text}</span>
          {toast.undo && <button onClick={toast.undo}>Batalkan</button>}
        </div>
      )}

      <nav className="nav" aria-label="Menu utama">
        <div className="brand"><b>Kesra Journal</b><span>Monitoring laporan rapat</span></div>
        <button className={view === 'monitor' ? 'on' : ''} onClick={() => { setView('monitor'); setTarget(null); }}>
          <Icon name="list" />Monitoring
        </button>
        <button className={view === 'kalender' ? 'on' : ''} onClick={() => { setView('kalender'); setTarget(null); }}>
          <Icon name="cal" />Kalender
        </button>
        <button className={view === 'form' ? 'on' : ''} onClick={newBlank}>
          <Icon name="plus" />Buat laporan
        </button>
        <button className={view === 'drive' ? 'on' : ''} onClick={() => { setView('drive'); setTarget(null); }}>
          <Icon name="folder" />Drive
        </button>
      </nav>
    </div>
  );
}
