import { toRaw } from 'vue';
import type { IFile, IFolder } from '@/types';

function isFolder(item: IFile | IFolder): item is IFolder {
  return Object.prototype.hasOwnProperty.call(item, 'children');
}

/** Maps every node in the forest (as a raw object) to its path string. */
export function collectPaths(
  children: (IFile | IFolder)[],
  prefix = '',
  out = new Map<IFile | IFolder, string>()
): Map<IFile | IFolder, string> {
  for (const child of children || []) {
    const raw = toRaw(child) as IFile | IFolder;
    const path = prefix ? `${prefix}/${raw.name}` : raw.name;
    out.set(raw, path);
    if (isFolder(raw)) {
      collectPaths(raw.children, path, out);
    }
  }
  return out;
}

/**
 * Resolves items that referenced nodes of `oldChildren` to their equivalents
 * in `newChildren`, matching by path. Items still present in the new forest
 * are kept as-is; items whose path no longer exists are dropped.
 *
 * Used when a consumer replaces the file tree wholesale (e.g. re-reading it
 * from the server after a move): state like the opened folders and the
 * selection would otherwise point at dead objects and reset.
 */
export function resolveAcrossForests(
  items: (IFile | IFolder)[],
  oldChildren: (IFile | IFolder)[],
  newChildren: (IFile | IFolder)[]
): (IFile | IFolder)[] {
  const oldPaths = collectPaths(oldChildren);
  const newPaths = collectPaths(newChildren);
  const newByPath = new Map<string, IFile | IFolder>();
  for (const [node, path] of newPaths) {
    newByPath.set(path, node);
  }

  return items
    .map(item => {
      const raw = toRaw(item) as IFile | IFolder;
      if (newPaths.has(raw)) return raw;
      const path = oldPaths.get(raw);
      return path !== undefined ? (newByPath.get(path) ?? null) : null;
    })
    .filter((item): item is IFile | IFolder => item !== null);
}
