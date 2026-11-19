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

  function primary() {
    if (!next) return;
    if (next.form) onForm(item, next.form);
    else if (next.to) onStatus(item, next.to);
  }

  return (
    <div className="card">
      <h3>{item.acara}</h3>
      <div className="meta">{item.tanggalText || 'Tanggal belum diisi'}</div>
      {item.penyelenggara && <div className="meta">{item.penyelenggara}</div>}

      <div className={'badge ' + meta.tone}>
        <span aria-hidden>{meta.icon}</span> {item.status}
      </div>

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

      <div className="row">
        {next && (
          <button className="grow" onClick={primary}>
            {next.label}
          </button>
        )}
        <button className="ghost" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? 'Tutup' : 'Lainnya'}
        </button>
      </div>

      {open && (
        <div className="more">
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor={'st' + item.rowId}>Ubah status</label>
            <select id={'st' + item.rowId} value={item.status} onChange={(e) => onStatus(item, e.target.value as Status)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {item.status === 'Belum Dibuat' && !hasReport && (
            <button className="ghost" onClick={() => onForm(item, 'create')}>Buat laporan</button>
          )}
          {hasReport && (
            <a className="btn ghost" href={item.linkLaporan} target="_blank" rel="noreferrer">Buka PDF</a>
          )}
          {item.linkWa && (
            <a className="btn ghost" href={item.linkWa} target="_blank" rel="noreferrer">Kirim ke WhatsApp</a>
          )}
          {hasReport && canEdit && (
            <button className="ghost" onClick={() => onForm(item, 'edit')}>Edit laporan</button>
          )}
          {hasReport && !canEdit && (
            <div className="meta">Laporan ini dibuat lewat Google Form lama, jadi belum bisa diedit di aplikasi.</div>
          )}
          {canEdit && hasReport && (
            <button className="danger" onClick={() => onDelete(item)}>Hapus laporan</button>
          )}
        </div>
      )}
    </div>
  );
}
