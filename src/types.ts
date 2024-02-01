export interface IToast {
  message: string;
  duration?: number;
  position?: "center" | "left";
  isInfinite?: boolean;
  type?: "success" | "error" | "info" | "default";
  // isPersistent?: boolean // Currently has no effect
}

export interface IDialog {
  title: string;
  content: string;
  confirmText?: string;
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
  parent: IFolder | null;
  isRenaming?: boolean;
  isCutting?: boolean;
  isDisabled?: boolean;
  isUploaded: boolean | undefined;
  uploadedSize?: number;
  key?: number;
  file: File | null;
}

export interface IFolder {
  name: string;
  parent?: IFolder | null;
  isRenaming?: boolean;
  isCutting?: boolean;
  isDisabled?: boolean;
  isUploaded?: boolean | undefined;
  key?: number;
  children: (IFile | IFolder)[];
}
