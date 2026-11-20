'use client';
import { useMemo } from 'react';
import type { Plan } from '@/lib/types';
import { dayLabel, planState } from '@/lib/plan';
import { REMINDER_DAYS } from '@/lib/config';
import { fmtDate } from '@/lib/format';
import Icon from './Icon';

// Kartu utama: rapat yang paling lama menunggu laporan (H sampai H+REMINDER_DAYS), lengkap dengan PIC.
export default function Reminders({ plans, onCreate }: { plans: Plan[]; onCreate: (p: Plan) => void }) {
  const due = useMemo(
    () =>
      plans
        .map((p) => ({ p, s: planState(p) }))
        .filter((x) => x.s.state === 'segera')
        .sort((a, b) => b.s.days - a.s.days),
    [plans]
  );
  const late = useMemo(() => plans.filter((p) => planState(p).state === 'terlewat').length, [plans]);
  if (!due.length && !late) return null;
  const [top, ...rest] = due;
  return (
    <div className="hero" role="region" aria-label="Pengingat laporan">
      {top && (
        <>
          <div>
            <span className="pill"><Icon name="bell" /> Laporan yang harus segera dibuat</span>
            <span className="pill">{dayLabel(top.s.days)} · batas pengingat H+{REMINDER_DAYS}</span>
          </div>
          <h3>{top.p.rapat}</h3>
          <div className="meta">PIC: <b>{top.p.pic}</b> · {fmtDate(top.p.tanggalIso)}</div>
          <button className="go" onClick={() => onCreate(top.p)}>Buat Laporan</button>
        </>
      )}
      {rest.length > 0 && (
        <div className="hero-more">
          {rest.map(({ p, s }) => (
            <div className="it" key={p.id}>
              <div style={{ minWidth: 0 }}>
                <b>{p.rapat}</b>
                <span className="meta">PIC: {p.pic} · {dayLabel(s.days)}</span>
              </div>
              <button className="ghost" onClick={() => onCreate(p)}>Buat</button>
            </div>
          ))}
        </div>
      )}
      {late > 0 && (
        <div className="meta" style={{ marginTop: 10 }}>
          Ada {late} rapat lewat H+{REMINDER_DAYS} yang laporannya belum dibuat. Lihat di menu Kalender.
        </div>
      )}
    </div>
  );
}
