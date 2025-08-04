import { VSnackbar } from 'vuetify/components';

// Vuetify does not export its types, so we unwrap them
type UnwrapReadonlyArray<A> = A extends Readonly<Array<infer I>> ? I : A;

export type SnackbarLocation = UnwrapReadonlyArray<VSnackbar['location']>;

export interface IToast {
  title?: string;
  message: string;
  duration?: number;
  location?: SnackbarLocation;
  isInfinite?: boolean;
  type?: 'success' | 'warning' | 'error' | 'info' | 'default';
  /** Used only when `isInfinite` is set to `true` */
  hasDoNotShowAgain?: boolean;
  // isPersistent?: boolean // Currently has no effect
  onDismissed?: (doNotShowAgain: boolean) => any;
}

export interface IDialog {
  title: string;
  content: string;
  confirmText?: string;
  confirmTextColor?: string;
  secondaryActionText?: string;
  cancelText?: string;
  contentClass?: string;
  isPersistent?: boolean;
  onConfirm: () => any;
  onSecondaryAction?: () => any;
  onCancel?: () => any;
}

export interface Config {
  restrict: boolean;
  trim: boolean;
  showUnfocusedDescription: boolean;
  hideRequiredAsterisk: boolean;
  collapseNewItems: boolean;
  initCollapsed: boolean;
  breakHorizontal: false | string;
  hideAvatar: boolean;
  hideArraySummaryValidation: boolean;
  vuetify?: Record<string, any>;
  isViewMode?: boolean;
  isReadOnly?: boolean;
  isDisabled?: boolean;
}

export interface IFile {
  name: string;
  serverName?: string;
  // parent: IFolder | null;
  isRenaming?: boolean;
  isCutting?: boolean;
  isDisabled?: boolean;
  isUploaded: boolean | undefined;
  uploadedSize?: number;
  key: number;
  file: File | null;
  highlight?: boolean;
  /** Helpful metadata to annotate before emiting items via events */
  path?: string;
}

export interface IFolder {
  name: string;
  // parent?: IFolder | null;
  isRenaming?: boolean;
  isCutting?: boolean;
  isDisabled?: boolean;
  isUploaded?: boolean | undefined;
  key: number;
  children: (IFile | IFolder)[];
  highlight?: boolean;
  path?: string;
}
