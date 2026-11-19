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
  key: string;
};

export type ListData = {
  items: Item[];
  folders: { undangan: string; rapat: string; lainnya: string; gdocs: string; pdf: string };
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
