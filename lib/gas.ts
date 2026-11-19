// Memanggil Apps Script (mesin dokumen) dari server Next.js.
export async function callGas(action: string, payload: Record<string, any> = {}) {
  const url = process.env.GAS_URL;
  const secret = process.env.GAS_SECRET;
  if (!url || !secret) throw new Error('GAS_URL / GAS_SECRET belum diisi di Vercel (Settings > Environment Variables).');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...payload, action, secret }),
    redirect: 'follow',
    cache: 'no-store',
  });
  const text = await res.text();
  let j: any;
  try {
    j = JSON.parse(text);
  } catch {
    throw new Error(
      'Apps Script tidak membalas JSON (HTTP ' + res.status + '). Cek deployment "Anyone" dan URL /exec. Isi balasan: ' +
        text.slice(0, 200).replace(/\s+/g, ' ')
    );
  }
  if (!j.ok) throw new Error(j.error || 'Kesalahan tidak diketahui dari Apps Script');
  return j.data;
}
