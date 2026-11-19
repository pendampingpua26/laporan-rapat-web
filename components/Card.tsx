'use client';
import { useState } from 'react';
import type { Item } from '@/lib/types';
import { NEXT, STAGES, STATUSES, STATUS_META, type Status } from '@/lib/status';

type Props = {
  item: Item;
  onStatus: (item: Item, to: Status) => void;
  onForm: (item: Item, mode: 'create' | 'edit') => void;
  onDelete: (item: Item) => void;
};

export default function Card({ item, onStatus, onForm, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[item.status];
  const next = NEXT[item.status];
  const hasReport = !!item.linkLaporan;
  const canEdit = !!item.key; // laporan dari aplikasi punya ID; laporan Google Form lama tidak
  const canDelete = !!item.rowId; // semua baris monitoring bisa dihapus

  return (
    <div className="card">
      <h3>{item.acara}</h3>
      <div className="meta">{item.tanggalText || 'Tanggal belum diisi'}</div>
      {item.penyelenggara && <div className="meta">{item.penyelenggara}</div>}

      <div className={'badge ' + meta.tone}>
        <span aria-hidden>{meta.icon}</span> {item.status}
      </div>
      {item.revisi > 0 && <div className="meta">Sudah direvisi {item.revisi}×</div>}

      <div className="progress" aria-label={'Tahap: ' + item.status}>
        {STAGES.map((s, i) => {
          const cls = i < meta.stage ? 'done' : i === meta.stage ? 'cur' + (meta.tone === 'act' ? ' warn' : '') : '';
          return (
            <div key={s} className={'pstep ' + cls}>
              <div className="dot" />
              {s}
            </div>
          );
        })}
      </div>

      {/* Ubah status: satu langkah, semua status (termasuk Revisi) langsung tersedia */}
      <div className="field" style={{ margin: '0 0 12px' }}>
        <label htmlFor={'st' + item.rowId}>Ubah status</label>
        <select id={'st' + item.rowId} value={item.status} onChange={(e) => onStatus(item, e.target.value as Status)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="row">
        {next?.form && (
          <button className="grow" onClick={() => onForm(item, next.form!)}>
            {next.label}
          </button>
        )}
        <button className="ghost" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? 'Tutup' : 'Lainnya'}
        </button>
      </div>

      {open && (
        <div className="more">
          {item.status !== 'Belum Dibuat' && !hasReport && (
            <button className="ghost" onClick={() => onForm(item, 'create')}>Buat laporan</button>
          )}
          {item.linkDocs && (
            <a className="btn ghost" href={item.linkDocs} target="_blank" rel="noreferrer">Buka Google Docs (edit langsung)</a>
          )}
          {hasReport && (
            <a className="btn ghost" href={item.linkLaporan} target="_blank" rel="noreferrer">Buka PDF</a>
          )}
          {item.linkWa && (
            <a className="btn ghost" href={item.linkWa} target="_blank" rel="noreferrer">Kirim ke WhatsApp</a>
          )}
          {hasReport && canEdit && !next?.form && (
            <button className="ghost" onClick={() => onForm(item, 'edit')}>Edit laporan</button>
          )}
          {hasReport && !canEdit && (
            <div className="meta">Laporan ini dibuat lewat Google Form lama, jadi belum bisa diedit di aplikasi.</div>
          )}
          {item.riwayat && (
            <details>
              <summary className="meta">Riwayat status</summary>
              <div className="riwayat">{item.riwayat}</div>
            </details>
          )}
          {canDelete && (
            <button className="danger" onClick={() => onDelete(item)}>Hapus dari daftar & spreadsheet</button>
          )}
        </div>
      )}
    </div>
  );
}
