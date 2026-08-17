import type { IFile, IFolder } from '@/types';

/** Stringify a JSON object and avoid circular references */
export function stringify(obj: any) {
  let cache: any = [];
  const str = JSON.stringify(obj, function (_key, value) {
    if (typeof value === 'object' && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return;
      }
      // Store value in our collection
      cache.push(value);
    }
    return value;
  });
  cache = null; // reset the cache
  return str;
}

/** An item is a folder when it carries a `children` array. */
export function isFolderItem(item: IFile | IFolder): boolean {
  return !!item && Object.prototype.hasOwnProperty.call(item, 'children');
}

function searchParent(folder: IFolder, item: IFile | IFolder): IFolder | null {
  if (folder.children?.includes(item)) {
    return folder;
  }

  for (const child of folder.children || []) {
    if (!isFolderItem(child)) {
      continue;
    }
    const found = searchParent(child as IFolder, item);
    if (found) {
      return found;
    }
  }

  return null;
}

/** The folder containing `item`, or `root` when it has no parent in the tree. */
export function findParentFolder(
  root: IFolder,
  item: IFile | IFolder
): IFolder {
  return searchParent(root, item) || root;
}

/** The folder an item stands for as a drop target: itself, or its parent when it is a file. */
export function resolveDropTarget(
  root: IFolder,
  item: IFile | IFolder | null | undefined
): IFolder {
  if (!item) {
    return root;
  }
  return isFolderItem(item)
    ? (item as IFolder)
    : findParentFolder(root, item);
}

/**
 * Where an upload should land: the selected folder, a selected file's parent,
 * or the root when the selection is empty or ambiguous.
 */
export function resolveUploadTarget(
  root: IFolder,
  selected: (IFile | IFolder)[]
): IFolder {
  const active = selected.length === 1 && selected[0] ? selected[0] : root;
  return resolveDropTarget(root, active);
}

/** Files from a native drop, skipping any directory entries. */
export function extractDroppedFiles(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer) {
    return [];
  }

  const items = Array.from(dataTransfer.items || []);
  if (!items.length) {
    return Array.from(dataTransfer.files || []);
  }

  return items
    .filter(item => item.kind === 'file')
    .filter(item => {
      const entry = (item as any).webkitGetAsEntry?.();
      return !entry || entry.isFile;
    })
    .map(item => item.getAsFile())
    .filter((file): file is File => !!file);
}
