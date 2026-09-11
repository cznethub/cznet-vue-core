import { describe, expect, it } from 'vitest';
import type { IFile, IFolder } from '@/types';
import { extractDroppedFiles, resolveDropTarget } from '@/utils';

const file = (name: string): IFile => ({ name, file: null } as unknown as IFile);
const folder = (name: string, children: (IFile | IFolder)[] = []): IFolder =>
  ({ name, children } as unknown as IFolder);

function tree() {
  const buried = file('buried.txt');
  const deep = folder('deep', [buried]);
  const nested = file('nested.txt');
  const docs = folder('docs', [nested, deep]);
  const top = file('top.txt');
  const root = folder('', [top, docs]);
  return { root, docs, deep, top, nested, buried };
}

describe('resolveDropTarget', () => {
  it('drops into the folder itself', () => {
    const { root, docs } = tree();
    expect(resolveDropTarget(root, docs)).toBe(docs);
  });

  it('drops into a nested folder', () => {
    const { root, deep } = tree();
    expect(resolveDropTarget(root, deep)).toBe(deep);
  });

  it("drops beside a file, into that file's parent", () => {
    const { root, docs, nested } = tree();
    expect(resolveDropTarget(root, nested)).toBe(docs);
  });

  it('drops a top-level file into root', () => {
    const { root, top } = tree();
    expect(resolveDropTarget(root, top)).toBe(root);
  });

  it('drops into root when there is no item under the cursor', () => {
    const { root } = tree();
    expect(resolveDropTarget(root, null)).toBe(root);
    expect(resolveDropTarget(root, undefined)).toBe(root);
  });
});

const asFile = (name: string) => new File(['x'], name);

/** Minimal stand-in for the DataTransfer a browser hands to a drop handler. */
function dataTransfer(
  items: { kind: string; file?: File; entry?: { isFile: boolean } | null }[],
  files: File[] = [],
): DataTransfer {
  return {
    items: items.map(i => ({
      kind: i.kind,
      getAsFile: () => i.file ?? null,
      webkitGetAsEntry: () => (i.entry === undefined ? { isFile: true } : i.entry),
    })),
    files,
  } as unknown as DataTransfer;
}

describe('extractDroppedFiles', () => {
  it('returns nothing when there is no data transfer', () => {
    expect(extractDroppedFiles(null)).toEqual([]);
  });

  it('returns the dropped files', () => {
    const a = asFile('a.txt');
    const b = asFile('b.txt');
    const result = extractDroppedFiles(
      dataTransfer([
        { kind: 'file', file: a },
        { kind: 'file', file: b },
      ]),
    );
    expect(result).toEqual([a, b]);
  });

  it('skips directory entries', () => {
    const loose = asFile('loose.txt');
    const dir = asFile('a-folder');
    const result = extractDroppedFiles(
      dataTransfer([
        { kind: 'file', file: loose },
        { kind: 'file', file: dir, entry: { isFile: false } },
      ]),
    );
    expect(result).toEqual([loose]);
  });

  it('skips non-file items such as dragged text', () => {
    const a = asFile('a.txt');
    const result = extractDroppedFiles(
      dataTransfer([
        { kind: 'string', file: null as unknown as File },
        { kind: 'file', file: a },
      ]),
    );
    expect(result).toEqual([a]);
  });

  it('drops items whose getAsFile returns null', () => {
    const a = asFile('a.txt');
    const result = extractDroppedFiles(
      dataTransfer([
        { kind: 'file', file: undefined },
        { kind: 'file', file: a },
      ]),
    );
    expect(result).toEqual([a]);
  });

  it('keeps files when the browser gives no entry information', () => {
    const a = asFile('a.txt');
    const result = extractDroppedFiles(
      dataTransfer([{ kind: 'file', file: a, entry: null }]),
    );
    expect(result).toEqual([a]);
  });

  it('falls back to the files list when items is empty', () => {
    const a = asFile('a.txt');
    expect(extractDroppedFiles(dataTransfer([], [a]))).toEqual([a]);
  });
});
