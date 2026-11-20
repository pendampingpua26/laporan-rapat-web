'use client';
import { useState } from 'react';

export default function Login({ onDone }: { onDone: () => void }) {
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) {
      setErr('PIN wajib diisi.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const j = await res.json().catch(() => null);
      if (j && j.ok) onDone();
      else setErr((j && j.error) || 'Gagal masuk.');
    } catch {
      setErr('Tidak ada koneksi internet.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <div className="eyebrow">✦ Subkelompok Kesejahteraan Rakyat &amp; Perekonomian</div>
      <h1>Kesra Journal</h1>
      <p className="sub">Masukkan PIN untuk membuka monitoring laporan rapat.</p>
      <form onSubmit={submit} className="card">
        <div className={'field' + (err ? ' bad' : '')}>
          <label htmlFor="pin">PIN</label>
          <input id="pin" type="password" autoComplete="current-password" value={pin} onChange={(e) => setPin(e.target.value)} />
          {err && <div className="err">{err}</div>}
        </div>
        <button className="wide" disabled={busy}>{busy ? 'Memeriksa…' : 'Masuk'}</button>
      </form>
    </div>
  );
}
