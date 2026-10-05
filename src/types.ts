import { VSnackbar } from 'vuetify/components';
import type { VNode } from 'vue';

// Vuetify does not export its types, so we unwrap them
type UnwrapReadonlyArray<A> = A extends Readonly<Array<infer I>> ? I : A;

export type SnackbarLocation = UnwrapReadonlyArray<VSnackbar['location']>;

export interface IToast {
  title?: string;
  message: string | VNode;
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

/** Where a custom action runs from, passed to its predicates and handler. */
export interface IFileExplorerActionContext {
  /** The folder the action targets: the selected folder, a selected file's parent, or the root. */
  folder: IFolder;
  /** `folder` as a path relative to the root, `''` for the root. */
  folderPath: string;
  /** `'toolbar'` for the top menu, `'context-menu'` for the right-click menu. */
  source: 'toolbar' | 'context-menu';
}

/** A consumer-supplied action rendered in the file explorer's top menu and context menu. */
export interface IFileExplorerAction {
  /** Unique identifier for the action. */
  key: string;
  label: string;
  /** An mdi icon name, e.g. `mdi-link-variant`. */
  icon: string;
  color?: string;
  /** Show in the top menu. Defaults to `true`. */
  toolbar?: boolean;
  /** Show in the context menu. Defaults to `true`. */
  contextMenu?: boolean;
  /**
   * Whether the action applies to `items`, which are the selection (top menu) or the
   * right-clicked selection (context menu; empty when right-clicking blank space).
   * Disables the top menu button and hides the context menu entry when `false`.
   * Defaults to always applicable.
   */
  isEnabled?: (
    _items: (IFile | IFolder)[],
    _context: IFileExplorerActionContext
  ) => boolean;
  /** Runs the action. Items carry an up-to-date `path`. The action shows as busy until a returned promise settles. */
  handler: (
    _items: (IFile | IFolder)[],
    _context: IFileExplorerActionContext
  ) => void | Promise<void>;
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
