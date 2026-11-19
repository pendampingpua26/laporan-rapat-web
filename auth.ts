import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const NAME = 'lr_session';

function token(): string {
  const s = process.env.SESSION_SECRET || '';
  return createHmac('sha256', s).update('laporan-rapat-ok').digest('hex');
}

export function envReady(): boolean {
  return !!(process.env.APP_PIN && process.env.SESSION_SECRET);
}

export function pinOk(pin: string): boolean {
  const p = process.env.APP_PIN || '';
  if (!p) return false;
  const a = Buffer.from(String(pin));
  const b = Buffer.from(p);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isLoggedIn(): Promise<boolean> {
  if (!envReady()) return false;
  const c = (await cookies()).get(NAME)?.value;
  if (!c) return false;
  const a = Buffer.from(c);
  const b = Buffer.from(token());
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setSession() {
  (await cookies()).set(NAME, token(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  });
}

export async function clearSession() {
  (await cookies()).delete(NAME);
}
