import type { Status } from './status';

export type Item = {
  rowId: number;
  acara: string;
  tanggalIso: string;
  tanggalText: string;
  tempat: string;
  penyelenggara: string;
  status: Status;
  linkLaporan: string;
  linkWa: string;
  linkDocs: string;
  key: string;
  revisi: number;
  riwayat: string;
};

export type Plan = {
  id: string;
  tanggalIso: string;
  rapat: string;
  pic: string;
  linkLaporan: string;
};

export type ListData = {
  items: Item[];
  plans: Plan[];
  warnings?: string[];
  folders: { undangan: string; rapat: string; lainnya: string; laporan: string };
};

export type FileRef = { id: string; name: string };
export type Files = { undangan: FileRef[]; rapat: FileRef[]; lainnya: FileRef[] };

export type SaveResult = {
  key: string;
  pdfUrl: string;
  docUrl: string;
  waUrl: string;
  waShort: string;
  waText: string;
};
