import { NextRequest, NextResponse } from 'next/server';
import { clearSession, envReady, isLoggedIn, pinOk, setSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: await isLoggedIn(), ready: envReady() });
}

export async function POST(req: NextRequest) {
  if (!envReady()) {
    return NextResponse.json(
      { ok: false, error: 'APP_PIN / SESSION_SECRET belum diisi di Vercel (Settings > Environment Variables), lalu Redeploy.' },
      { status: 500 }
    );
  }
  let pin = '';
  try {
    pin = String((await req.json()).pin ?? '');
  } catch {}
  await new Promise((r) => setTimeout(r, 700)); // memperlambat tebak-tebakan PIN
  if (!pinOk(pin)) return NextResponse.json({ ok: false, error: 'PIN salah.' }, { status: 401 });
  await setSession();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
