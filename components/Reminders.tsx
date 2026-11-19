'use client';
import { useMemo } from 'react';
import type { Plan } from '@/lib/types';
import { dayLabel, planState } from '@/lib/plan';
import { REMINDER_DAYS } from '@/lib/config';
import { fmtDate } from '@/lib/format';

// Daftar rapat yang laporannya harus segera dibuat (hari rapat sampai H+REMINDER_DAYS), lengkap dengan nama PIC.
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
  return (
    <div className="remind" role="region" aria-label="Pengingat laporan">
      <h2>🔔 Laporan yang harus segera dibuat</h2>
      {due.map(({ p, s }) => (
        <div className="it" key={p.id}>
          <div className="tx">
            <b>{p.rapat}</b>
            <span className="meta">PIC: {p.pic} · {fmtDate(p.tanggalIso)}</span>
            <div><span className="tag segera">{dayLabel(s.days)}</span><span className="meta">batas pengingat H+{REMINDER_DAYS}</span></div>
          </div>
          <button onClick={() => onCreate(p)}>Buat</button>
        </div>
      ))}
      {late > 0 && <div className="meta" style={{ marginTop: 6 }}>Ada {late} rapat lewat H+{REMINDER_DAYS} yang belum ada laporannya. Lihat menu Jadwal.</div>}
    </div>
  );
}
