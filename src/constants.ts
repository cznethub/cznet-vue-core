import { IToast } from './types';

export const APP_NAME = 'CZNet Vue Core';
export const APP_GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY || '';
export const DEFAULT_TOAST_DURATION = 3500;
export const FILE_ICONS: { [key: string]: string } = {
  html: 'mdi-language-html5',
  md: 'mdi-language-markdown',
  js: 'mdi-nodejs',
  json: 'mdi-code-json',
  geojson: 'mdi-code-json',
  pdf: 'mdi-file-pdf-box',
  txt: 'mdi-file-document-outline',
  csv: 'mdi-file-delimited',

  zip: 'mdi-folder-zip',
  rar: 'mdi-folder-zip',
  'tar.gz': 'mdi-folder-zip',

  exe: 'mdi-application-outline',

  png: 'mdi-file-image-outline',
  jpg: 'mdi-file-image-outline',
  bmp: 'mdi-file-image-outline',
  gif: 'mdi-file-image-outline',
  jpeg: 'mdi-file-image-outline',

  mp4: 'mdi-file-video-outline',

  mp3: 'mdi-file-music-outline',
  wav: 'mdi-file-music-outline',

  xlsm: 'mdi-file-excel-outline',
  xlsb: 'mdi-file-excel-outline',
  xlsx: 'mdi-file-excel-outline',
  xltx: 'mdi-file-excel-outline',
  xltm: 'mdi-file-excel-outline',
  xlt: 'mdi-file-excel-outline',
  xls: 'mdi-file-excel-outline',
  xla: 'mdi-file-excel-outline',
  doc: 'mdi-file-document-outline',
  docx: 'mdi-file-document-outline',
  xml: 'mdi-file-xml-box',

  ppt: 'mdi-file-powerpoint-outline',
  pptx: 'mdi-file-powerpoint-outline',

  card: 'mdi-file-cad',
  default: 'mdi-file-outline',
};

export const INITIAL_SNACKBAR: IToast & {
  isActive: boolean;
  isInfinite: boolean;
} = {
  title: '',
  message: '',
  duration: DEFAULT_TOAST_DURATION,
  location: 'bottom center',
  type: 'default',
  isActive: false,
  isInfinite: false,
  hasDoNotShowAgain: false,
  // isPersistent: false,
  onDismissed: () => {},
};
