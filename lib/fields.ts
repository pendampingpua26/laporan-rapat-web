// Nama (name) HARUS sama dengan judul kolom di spreadsheet A dan penanda <<...>> di template Docs.
export type FieldDef = {
  name: string;
  label: string;
  hint: string;
  type: 'text' | 'textarea' | 'date' | 'select';
  placeholder?: string;
  rows?: number;
  options?: string[];
};

export const DARI_SURAT_OPTIONS = [
  'Kepala Bidang Penatausahaan Aset',
  'Ketua Subkelompok Penatausahaan Aset Kesejahteraan Rakyat dan Perekonomian',
];

export const STEPS: { title: string; fields: FieldDef[] }[] = [
  {
    title: '1. Info rapat',
    fields: [
      { name: 'Acara', label: 'Acara', type: 'text', hint: 'Nama rapat (terisi otomatis kalau dibuat dari Jadwal)' },
      { name: 'Hari/Tanggal Pelaksanaan Rapat', label: 'Hari/Tanggal Pelaksanaan', type: 'date', hint: '' },
      { name: 'Waktu Rapat', label: 'Waktu Rapat', type: 'text', placeholder: '14.00 WIB s.d selesai', hint: 'Contoh: 14.00 WIB s.d selesai' },
      { name: 'Tempat Rapat', label: 'Tempat Rapat', type: 'text', hint: 'Contoh: Ruang Rapat Siera, Gedung Dinas Teknis Abdul Muis' },
      { name: 'Pimpinan Rapat', label: 'Pimpinan Rapat', type: 'text', hint: 'Contoh: Kepala Subkelompok Kesejahteraan Rakyat dan Perekonomian' },
      { name: 'Penyelenggara Rapat', label: 'Penyelenggara Rapat', type: 'text', hint: 'Contoh: PUA, BPAD' },
    ],
  },
  {
    title: '2. Surat',
    fields: [
      { name: 'Tujuan Surat', label: 'Tujuan Surat', type: 'text', hint: 'Contoh: Kepala Badan Pengelolaan Aset Daerah' },
      {
        name: 'Dari Surat',
        label: 'Dari Surat',
        type: 'select',
        options: DARI_SURAT_OPTIONS,
        hint:
          'Jika yang mengadakan rapat Internal = Dari Kasubkel ke Kabid, pilih Ketua Subkelompok Kesra. ' +
          'Jika yang mengadakan rapat Eksternal = Dari Kabid ke Kaban, pilih Kepala Bidang Penatausahaan Aset.',
      },
      { name: 'Penerima Disposisi', label: 'Penerima Disposisi', type: 'textarea', rows: 3, hint: 'Nama pegawai yang ditugaskan hadir (satu nama per baris)' },
      { name: 'Notulen', label: 'Notulen', type: 'text', hint: 'Nama yang akan tandatangan di Laporan' },
    ],
  },
  {
    title: '3. Isi laporan',
    fields: [
      { name: 'Latar Belakang', label: 'Latar Belakang', type: 'textarea', rows: 4, hint: '' },
      { name: 'Pembahasan', label: 'Pembahasan', type: 'textarea', rows: 8, hint: '' },
      { name: 'Kesimpulan dan Tindak Lanjut', label: 'Kesimpulan dan Tindak Lanjut', type: 'textarea', rows: 6, hint: '' },
    ],
  },
];

export type FileKind = 'undangan' | 'rapat' | 'lainnya';
export const FILE_FIELDS: { kind: FileKind; label: string; hint: string; required: boolean; accept: string }[] = [
  {
    kind: 'undangan',
    label: 'Foto Undangan',
    hint:
      'Apabila undangan lebih dari satu halaman, WAJIB diurutkan nama file-nya. ' +
      'Contoh: 01_Undangan Rapat Sosialisasi KIB D, 02_Undangan Rapat Sosialisasi',
    required: true,
    accept: 'image/*',
  },
  { kind: 'rapat', label: 'Foto Pelaksanaan Rapat', hint: '', required: true, accept: 'image/*' },
  { kind: 'lainnya', label: 'Dokumen Lainnya', hint: 'Materi atau lampiran lain (opsional)', required: false, accept: '*/*' },
];

export const LAST_STEP_TITLE = '4. Lampiran';
export const ALL_FIELDS: FieldDef[] = STEPS.flatMap((s) => s.fields);
