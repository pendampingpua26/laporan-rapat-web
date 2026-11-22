'use client';
import { useMemo } from 'react';
import type { Plan } from '@/lib/types';
import { dayLabel, planState } from '@/lib/plan';
import { REMINDER_DAYS } from '@/lib/config';
import { fmtDate } from '@/lib/format';
import Icon from './Icon';

const MAX_LIST = 5;

// Kartu pengingat di atas Monitoring. Rapat yang laporannya belum dibuat tetap tampil di sini,
// baik masih dalam H sampai H+REMINDER_DAYS maupun sudah terlewat, sampai laporannya dibuat.
export default function Reminders({ plans, onCreate }: { plans: Plan[]; onCreate: (p: Plan) => void }) {
  const due = useMemo(
    () =>
      plans
        .map((p) => ({ p, s: planState(p) }))
        .filter((x) => x.s.state === 'segera' || x.s.state === 'terlewat')
        .sort((a, b) => b.s.days - a.s.days), // yang paling lama menunggu di paling atas
    [plans]
  );
  if (!due.length) return null;
  const [top, ...rest] = due;
  const shown = rest.slice(0, MAX_LIST);
  const hidden = rest.length - shown.length;
  const topLate = top.s.state === 'terlewat';
  return (
    <div className="hero" role="region" aria-label="Pengingat laporan">
      <div>
        <span className="pill"><Icon name="bell" /> Laporan yang harus segera dibuat</span>
        <span className={'pill' + (topLate ? ' late' : '')}>
          {topLate ? `Terlewat H+${top.s.days}` : dayLabel(top.s.days)} · batas pengingat H+{REMINDER_DAYS}
        </span>
      </div>
      <h3>{top.p.rapat}</h3>
      <div className="meta">Penerima Disposisi: <b>{top.p.pic}</b> · {fmtDate(top.p.tanggalIso)}</div>
      <button className="go" onClick={() => onCreate(top.p)}>Buat Laporan</button>

      {shown.length > 0 && (
        <div className="hero-more">
          {shown.map(({ p, s }) => (
            <div className="it" key={p.id}>
              <div style={{ minWidth: 0 }}>
                <b>{p.rapat}</b>
                <span className="meta">
                  Penerima Disposisi: {p.pic} · {s.state === 'terlewat' ? <b className="lt">Terlewat H+{s.days}</b> : dayLabel(s.days)}
                </span>
              </div>
              <button className="ghost" onClick={() => onCreate(p)}>Buat</button>
            </div>
          ))}
          {hidden > 0 && <div className="meta" style={{ paddingTop: 4 }}>+ {hidden} rapat lainnya. Lihat semuanya di menu Kalender.</div>}
        </div>
      )}
    </div>
  );
}
