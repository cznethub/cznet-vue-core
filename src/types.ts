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
}
