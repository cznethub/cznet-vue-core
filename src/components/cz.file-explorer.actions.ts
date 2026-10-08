import type {
  IFile,
  IFileExplorerAction,
  IFileExplorerActionContext,
  IFolder,
} from '@/types';

export function isActionPlaced(
  action: IFileExplorerAction,
  source: IFileExplorerActionContext['source']
): boolean {
  return source === 'toolbar'
    ? action.toolbar !== false
    : action.contextMenu !== false;
}

export function isActionEnabled(
  action: IFileExplorerAction,
  items: (IFile | IFolder)[],
  context: IFileExplorerActionContext
): boolean {
  return action.isEnabled ? action.isEnabled(items, context) : true;
}

/** Actions to list in the context menu: placed there and applicable to `items`. */
export function contextMenuActions(
  actions: IFileExplorerAction[],
  items: (IFile | IFolder)[],
  context: IFileExplorerActionContext
): IFileExplorerAction[] {
  return actions.filter(
    action =>
      isActionPlaced(action, 'context-menu') &&
      isActionEnabled(action, items, context)
  );
}
