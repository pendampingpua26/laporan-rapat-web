'use client';
import { useEffect, useRef, useState } from 'react';
import { ALL_FIELDS, FILE_FIELDS, LAST_STEP_TITLE, STEPS, type FileKind, type FieldDef } from '@/lib/fields';
import type { FileRef, Files, SaveResult } from '@/lib/types';
import { prepareFile, rpc } from '@/lib/client';

type Props = {
  mode: 'create' | 'edit';
  editKey?: string;
  monRowId?: number;
  initial: Record<string, string>;
  draftId: string;
  onClose: () => void;
  onSaved: () => void;
};

const EMPTY: Files = { undangan: [], rapat: [], lainnya: [] };
const TOTAL = STEPS.length + 1;

export default function Wizard({ mode, editKey, monRowId, initial, draftId, onClose, onSaved }: Props) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [files, setFiles] = useState<Files>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(mode === 'edit');
  const [loadErr, setLoadErr] = useState('');
  const [uploading, setUploading] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [result, setResult] = useState<SaveResult | null>(null);
  const ready = useRef(false);
  const draftKey = 'lr-draft-' + draftId;

  // muat data awal: laporan lama (edit) atau draf yang tersimpan di HP
  useEffect(() => {
    let alive = true;
    (async () => {
      if (mode === 'edit' && editKey) {
        try {
          const r = await rpc<{ fields: Record<string, string>; photos: Files }>('getReport', { key: editKey });
          if (!alive) return;
          setValues({ ...initial, ...r.fields });
          setFiles({ ...EMPTY, ...r.photos });
        } catch (e: any) {
          if (alive) setLoadErr(e.message);
        }
        if (alive) setLoading(false);
      } else {
        try {
          const raw = localStorage.getItem(draftKey);
          if (raw) {
            const d = JSON.parse(raw);
            if (d.values) setValues({ ...initial, ...d.values });
            if (d.files) setFiles({ ...EMPTY, ...d.files });
            if (typeof d.step === 'number') setStep(Math.min(d.step, TOTAL - 1));
          }
        } catch {}
      }
      ready.current = true;
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // draf tersimpan otomatis (hanya untuk laporan baru)
  useEffect(() => {
    if (mode !== 'create' || !ready.current || result) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ values, files, step }));
    } catch {}
  }, [values, files, step, mode, result, draftKey]);

  function set(name: string, v: string) {
    setValues((p) => ({ ...p, [name]: v }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  }

  function validate(s: number): Record<string, string> {
    const e: Record<string, string> = {};
    if (s < STEPS.length) {
      STEPS[s].fields.forEach((f) => {
        if (!String(values[f.name] || '').trim()) e[f.name] = `${f.label} wajib diisi`;
      });
    } else {
      FILE_FIELDS.filter((f) => f.required).forEach((f) => {
        if (!files[f.kind].length) e['file-' + f.kind] = `${f.label} wajib diisi, minimal satu file`;
      });
    }
    return e;
  }

  function scrollToFirst(e: Record<string, string>) {
    const first = Object.keys(e).find((k) => e[k]);
    if (first) document.getElementById('f-' + first)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function next() {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) {
      scrollToFirst(e);
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0 });
  }

  async function addFiles(kind: FileKind, list: FileList | null) {
    if (!list || !list.length) return;
    setErrors((p) => ({ ...p, ['file-' + kind]: '' }));
    for (const file of Array.from(list)) {
      setUploading(`Mengunggah ${file.name}…`);
      try {
        const prepared = await prepareFile(file);
        const r = await rpc<FileRef>('uploadFile', { kind, ...prepared });
        setFiles((p) => ({ ...p, [kind]: [...p[kind], { id: r.id, name: r.name }] }));
      } catch (e: any) {
        setErrors((p) => ({ ...p, ['file-' + kind]: e.message }));
        break;
      }
    }
    setUploading('');
  }

  function removeFile(kind: FileKind, id: string) {
    setFiles((p) => ({ ...p, [kind]: p[kind].filter((f) => f.id !== id) }));
  }

  async function save() {
    for (let s = 0; s < TOTAL; s++) {
      const e = validate(s);
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(s);
        setTimeout(() => scrollToFirst(e), 100);
        return;
      }
    }
    setSaving(true);
    setSaveErr('');
    try {
      const r = await rpc<SaveResult>('save', {
        key: mode === 'edit' ? editKey : undefined,
        monRowId,
        fields: values,
        photos: {
          undangan: files.undangan.map((f) => f.id),
          rapat: files.rapat.map((f) => f.id),
          lainnya: files.lainnya.map((f) => f.id),
        },
      });
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      setResult(r);
      onSaved();
    } catch (e: any) {
      setSaveErr('Gagal menyimpan: ' + e.message + ' Isianmu masih aman, silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  function renderField(f: FieldDef) {
    const err = errors[f.name];
    const common = { id: 'in-' + f.name, value: values[f.name] || '', onChange: (e: any) => set(f.name, e.target.value) };
    return (
      <div key={f.name} id={'f-' + f.name} className={'field' + (err ? ' bad' : '')}>
        <label htmlFor={common.id}>
          {f.label}
          <span className="req" aria-hidden>*</span>
        </label>
        <div className="hint">{f.hint}</div>
        {f.type === 'textarea' ? (
          <textarea {...common} rows={f.rows || 4} />
        ) : (
          <input {...common} type={f.type === 'date' ? 'date' : 'text'} placeholder={f.placeholder} />
        )}
        {err && <div className="err">{err}</div>}
      </div>
    );
  }

  if (result) {
    return (
      <div>
        <h1>✔ Laporan tersimpan</h1>
        <p className="sub">Dokumen dan PDF sudah dibuat. Status laporan: Laporan Dibuat.</p>
        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <a className="btn wide" href={result.waUrl} target="_blank" rel="noreferrer">Kirim ke WhatsApp</a>
          <a className="btn ghost wide" href={result.pdfUrl} target="_blank" rel="noreferrer">Buka PDF</a>
          <a className="btn ghost wide" href={result.docUrl} target="_blank" rel="noreferrer">Buka dokumen (Google Docs)</a>
          <button className="ghost wide" onClick={onClose}>Kembali ke monitoring</button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="center">Memuat laporan…</div>;
  if (loadErr)
    return (
      <div>
        <div className="banner">{loadErr}</div>
        <button className="ghost" onClick={onClose}>Kembali</button>
      </div>
    );

  const last = step === TOTAL - 1;
  const title = last ? LAST_STEP_TITLE : STEPS[step].title;

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>{mode === 'edit' ? 'Edit laporan' : 'Buat laporan'}</h1>
        <button className="ghost" onClick={onClose}>Tutup</button>
      </div>
      <div className="meta">Langkah {step + 1} dari {TOTAL} · {title}</div>
      <div className="stepbar"><div style={{ width: `${((step + 1) / TOTAL) * 100}%` }} /></div>
      {mode === 'create' && <div className="hint">Isianmu tersimpan otomatis di HP ini.</div>}

      {!last && STEPS[step].fields.map(renderField)}

      {last &&
        FILE_FIELDS.map((f) => {
          const err = errors['file-' + f.kind];
          return (
            <div key={f.kind} id={'f-file-' + f.kind} className={'field' + (err ? ' bad' : '')}>
              <label>
                {f.label}
                {f.required && <span className="req" aria-hidden>*</span>}
              </label>
              <div className="hint">{f.hint}</div>
              <label className="btn ghost filebtn" style={{ fontWeight: 600 }}>
                {f.kind === 'lainnya' ? 'Pilih file' : 'Ambil / pilih foto'}
                <input type="file" accept={f.accept} multiple onChange={(e) => { addFiles(f.kind, e.target.files); e.target.value = ''; }} />
              </label>
              <div className="files">
                {files[f.kind].map((x) => (
                  <div className="file" key={x.id}>
                    {f.kind !== 'lainnya' && (
                      <img src={`https://drive.google.com/thumbnail?id=${x.id}&sz=w200`} alt="" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                    )}
                    <div className="nm">{x.name}</div>
                    <button className="danger" onClick={() => removeFile(f.kind, x.id)}>Hapus</button>
                  </div>
                ))}
              </div>
              {err && <div className="err">{err}</div>}
            </div>
          );
        })}

      {uploading && <div className="hint">{uploading}</div>}
      {saveErr && <div className="banner">{saveErr}</div>}

      <div className="row" style={{ marginTop: 8 }}>
        {step > 0 && (
          <button className="ghost grow" onClick={() => { setStep(step - 1); window.scrollTo({ top: 0 }); }}>Kembali</button>
        )}
        {!last ? (
          <button className="grow" onClick={next}>Lanjut</button>
        ) : (
          <button className="grow" onClick={save} disabled={saving || !!uploading}>
            {mode === 'edit' ? 'Simpan perubahan' : 'Simpan & buat laporan'}
          </button>
        )}
      </div>

      {saving && (
        <div className="overlay" role="alert">
          <div>
            <h2>Sedang menyimpan…</h2>
            <p>Membuat dokumen dan PDF. Ini bisa 20-60 detik. Jangan tutup halaman ini.</p>
          </div>
        </div>
      )}
    </div>
  );
}
