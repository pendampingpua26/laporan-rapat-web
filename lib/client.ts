// Fungsi pembantu yang dipakai di browser.
export async function rpc<T = any>(action: string, payload: Record<string, any> = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch('/api/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch {
    throw new Error('Tidak ada koneksi internet. Coba lagi saat sinyal sudah baik.');
  }
  let j: any = null;
  try {
    j = await res.json();
  } catch {}
  if (res.status === 401) {
    window.dispatchEvent(new Event('lr-logout'));
    throw new Error('Sesi habis. Masuk lagi dengan PIN.');
  }
  if (!j || !j.ok) throw new Error((j && j.error) || 'Terjadi kesalahan (HTTP ' + res.status + ').');
  return j.data as T;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(new Error('Gagal membaca file.'));
    r.readAsDataURL(blob);
  });
}

// Foto dikecilkan dulu supaya muat di batas kiriman Vercel (4,5 MB) dan cepat di sinyal HP.
export async function prepareFile(file: File): Promise<{ name: string; mime: string; data: string }> {
  if (file.type.startsWith('image/')) {
    try {
      const bmp = await createImageBitmap(file);
      const max = 1600;
      const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('Gagal memproses foto.'))), 'image/jpeg', 0.78)
      );
      const base = file.name.replace(/\.[^.]+$/, '') || 'foto';
      return { name: base + '.jpg', mime: 'image/jpeg', data: await blobToBase64(blob) };
    } catch {
      // jatuh ke pengiriman biasa di bawah
    }
  }
  if (file.size > 3 * 1024 * 1024) throw new Error(`"${file.name}" lebih dari 3 MB. Kecilkan dulu filenya.`);
  return { name: file.name, mime: file.type || 'application/octet-stream', data: await blobToBase64(file) };
}
