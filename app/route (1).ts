import { NextRequest, NextResponse } from 'next/server';
import { isLoggedIn } from '@/lib/auth';
import { callGas } from '@/lib/gas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ALLOWED = new Set(['list', 'getReport', 'uploadFile', 'save', 'setStatus', 'remove', 'planSave', 'planRemove']);

export async function POST(req: NextRequest) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ ok: false, error: 'Sesi habis. Masuk lagi dengan PIN.' }, { status: 401 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Permintaan tidak valid.' }, { status: 400 });
  }
  const { action, ...rest } = body || {};
  if (!ALLOWED.has(action)) {
    return NextResponse.json({ ok: false, error: 'Aksi tidak dikenal.' }, { status: 400 });
  }
  try {
    const data = await callGas(action, rest);
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
