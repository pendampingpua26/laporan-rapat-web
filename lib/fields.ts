// Nama (name) HARUS sama dengan judul kolom di spreadsheet A dan penanda <<...>> di template Docs.
export type FieldDef = {
  name: string;
  label: string;
  hint: string;
  type: 'text' | 'textarea' | 'date';
  placeholder?: string;
  rows?: number;
};

export const STEPS: { title: string; fields: FieldDef[] }[] = [
  {
    title: '1. Info rapat',
    fields: [
      { name: 'Acara', label: 'Acara', type: 'text', hint: 'Nama rapat sesuai undangan. Contoh: Rapat Koordinasi Penyusunan RKA 2027' },
      { name: 'Hari/Tanggal Pelaksanaan Rapat', label: 'Hari/Tanggal Pelaksanaan', type: 'date', hint: 'Tanggal rapat berlangsung, bukan tanggal membuat laporan' },
      { name: 'Waktu Rapat', label: 'Waktu Rapat', type: 'text', placeholder: '09.00 - 11.30 WIB', hint: 'Jam mulai sampai selesai. Contoh: 09.00 - 11.30 WIB' },
      { name: 'Tempat Rapat', label: 'Tempat Rapat', type: 'text', hint: 'Nama ruangan atau lokasi, atau tulis “Zoom” kalau daring' },
      { name: 'Pimpinan Rapat', label: 'Pimpinan Rapat', type: 'text', hint: 'Nama dan jabatan yang memimpin rapat' },
      { name: 'Penyelenggara Rapat', label: 'Penyelenggara Rapat', type: 'text', hint: 'Instansi atau unit yang mengundang' },
    ],
  },
  {
    title: '2. Surat',
    fields: [
      { name: 'Tujuan Surat', label: 'Tujuan Surat', type: 'text', hint: 'Kepada siapa laporan ini ditujukan' },
      { name: 'Dari Surat', label: 'Dari Surat', type: 'text', hint: 'Siapa yang membuat laporan' },
      { name: 'Penerima Disposisi', label: 'Penerima Disposisi', type: 'textarea', rows: 3, hint: 'Nama pegawai yang ditugaskan hadir, satu nama per baris' },
      { name: 'Notulen', label: 'Notulen', type: 'text', hint: 'Nama yang akan menandatangani laporan' },
    ],
  },
  {
    title: '3. Isi laporan',
    fields: [
      { name: 'Latar Belakang', label: 'Latar Belakang', type: 'textarea', rows: 4, hint: 'Alasan rapat diadakan, 2-3 kalimat' },
      { name: 'Pembahasan', label: 'Pembahasan', type: 'textarea', rows: 7, hint: 'Poin-poin utama yang dibahas, urut sesuai jalannya rapat' },
      { name: 'Kesimpulan dan Tindak Lanjut', label: 'Kesimpulan dan Tindak Lanjut', type: 'textarea', rows: 6, hint: 'Keputusan rapat dan tugas yang harus dikerjakan, beserta penanggung jawab' },
    ],
  },
];

export type FileKind = 'undangan' | 'rapat' | 'lainnya';
export const FILE_FIELDS: { kind: FileKind; label: string; hint: string; required: boolean; accept: string }[] = [
  { kind: 'undangan', label: 'Foto Undangan', hint: 'Foto atau tangkapan layar undangan. Boleh lebih dari satu', required: true, accept: 'image/*' },
  { kind: 'rapat', label: 'Foto Pelaksanaan Rapat', hint: 'Foto saat rapat berlangsung, minimal satu', required: true, accept: 'image/*' },
  { kind: 'lainnya', label: 'Dokumen Lainnya', hint: 'Materi atau lampiran lain (opsional, maksimal 3 MB per file)', required: false, accept: '*/*' },
];

export const LAST_STEP_TITLE = '4. Lampiran';
export const ALL_FIELDS: FieldDef[] = STEPS.flatMap((s) => s.fields);
