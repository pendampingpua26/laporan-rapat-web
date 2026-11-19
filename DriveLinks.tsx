'use client';
import type { ListData } from '@/lib/types';

export default function DriveLinks({ data, loading }: { data: ListData | null; loading: boolean }) {
  const rows = data
    ? [
        { t: 'Foto Undangan', d: 'Semua foto undangan rapat', u: data.folders.undangan },
        { t: 'Foto Pelaksanaan Rapat', d: 'Semua foto saat rapat berlangsung', u: data.folders.rapat },
        { t: 'Dokumen Lainnya', d: 'Materi dan lampiran lain', u: data.folders.lainnya },
        { t: 'Laporan (Docs dan PDF)', d: 'Hasil laporan format Google Docs dan PDF', u: data.folders.laporan },
      ].filter((r) => !!r.u)
    : [];
  return (
    <div>
      <h1>Drive</h1>
      <p className="sub">Pintasan ke empat folder tempat file laporan disimpan.</p>
      {loading && !data && <div className="center">Memuat…</div>}
      {rows.map((r) => (
        <div className="card" key={r.t}>
          <h3>📁 {r.t}</h3>
          <div className="meta" style={{ marginBottom: 10 }}>{r.d}</div>
          <a className="btn wide" href={r.u} target="_blank" rel="noreferrer">Buka folder</a>
        </div>
      ))}
    </div>
  );
}
