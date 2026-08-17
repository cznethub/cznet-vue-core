import { describe, expect, it } from 'vitest';
import type { IFile, IFolder } from '@/types';
import {
  findParentFolder,
  isFolderItem,
  resolveUploadTarget,
} from '@/utils';

const file = (name: string): IFile => ({ name, file: null } as unknown as IFile);
const folder = (name: string, children: (IFile | IFolder)[] = []): IFolder =>
  ({ name, children } as unknown as IFolder);

/**
 *  root
 *  ├── top.txt
 *  └── docs
 *      ├── nested.txt
 *      └── deep
 *          └── buried.txt
 */
function tree() {
  const buried = file('buried.txt');
  const deep = folder('deep', [buried]);
  const nested = file('nested.txt');
  const docs = folder('docs', [nested, deep]);
  const top = file('top.txt');
  const root = folder('', [top, docs]);
  return { root, docs, deep, top, nested, buried };
}

describe('isFolderItem', () => {
  it('distinguishes folders from files by the children property', () => {
    expect(isFolderItem(folder('docs'))).toBe(true);
    expect(isFolderItem(file('a.txt'))).toBe(false);
  });
});

describe('findParentFolder', () => {
  it('returns root for a top-level item', () => {
    const { root, top } = tree();
    expect(findParentFolder(root, top)).toBe(root);
  });

  it('finds the immediate parent of a nested file', () => {
    const { root, docs, nested } = tree();
    expect(findParentFolder(root, nested)).toBe(docs);
  });

  it('finds the parent of a deeply nested file', () => {
    const { root, deep, buried } = tree();
    expect(findParentFolder(root, buried)).toBe(deep);
  });

  it('finds the parent of a nested folder', () => {
    const { root, docs, deep } = tree();
    expect(findParentFolder(root, deep)).toBe(docs);
  });

  it('falls back to root for an item that is not in the tree', () => {
    const { root } = tree();
    expect(findParentFolder(root, file('orphan.txt'))).toBe(root);
  });
});

describe('resolveUploadTarget', () => {
  it('uploads to root when nothing is selected', () => {
    const { root } = tree();
    expect(resolveUploadTarget(root, [])).toBe(root);
  });

  it('uploads into the selected folder', () => {
    const { root, docs } = tree();
    expect(resolveUploadTarget(root, [docs])).toBe(docs);
  });

  it('uploads into a deeply selected folder', () => {
    const { root, deep } = tree();
    expect(resolveUploadTarget(root, [deep])).toBe(deep);
  });

  it("uploads beside a selected file, into that file's parent", () => {
    const { root, docs, nested } = tree();
    expect(resolveUploadTarget(root, [nested])).toBe(docs);
  });

  it('uploads to root when the selected file is top-level', () => {
    const { root, top } = tree();
    expect(resolveUploadTarget(root, [top])).toBe(root);
  });

  it('falls back to root when the selection is ambiguous', () => {
    const { root, docs, deep } = tree();
    expect(resolveUploadTarget(root, [docs, deep])).toBe(root);
  });

  it('falls back to root when the single selection is nullish', () => {
    const { root } = tree();
    expect(resolveUploadTarget(root, [undefined as unknown as IFile])).toBe(root);
  });
});
