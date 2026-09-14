import { describe, expect, it } from 'vitest';
import { reactive, toRaw } from 'vue';
import {
  collectPaths,
  resolveAcrossForests,
} from '../src/components/cz.file-explorer.tree';
import { IFile, IFolder } from '../src/types';

let keyCounter = 0;

function file(name: string): IFile {
  return { name, key: keyCounter++, file: null, isUploaded: true };
}

function folder(name: string, children: (IFile | IFolder)[] = []): IFolder {
  return { name, key: keyCounter++, children };
}

function makeForest() {
  const deep = folder('deep', [file('deep file.txt')]);
  const docs = folder('docs', [deep, file('readme.txt')]);
  const empty = folder('empty');
  return [docs, empty, file('logs.txt')] as (IFile | IFolder)[];
}

/** Clones a forest into all-new objects, as a server re-read produces. */
function cloneForest(children: (IFile | IFolder)[]): (IFile | IFolder)[] {
  return children.map(node => {
    const copy: any = { name: node.name };
    if (Object.prototype.hasOwnProperty.call(node, 'children')) {
      copy.children = cloneForest((node as IFolder).children);
    }
    return copy;
  });
}

describe('collectPaths', () => {
  it('maps every node to its slash-joined path', () => {
    const forest = makeForest();
    const paths = [...collectPaths(forest).values()];
    expect(paths).toEqual([
      'docs',
      'docs/deep',
      'docs/deep/deep file.txt',
      'docs/readme.txt',
      'empty',
      'logs.txt',
    ]);
  });

  it('keys the map by raw objects even for a reactive forest', () => {
    const forest = reactive({ children: makeForest() }).children;
    const rawDocs = toRaw(forest[0]);
    expect(collectPaths(forest).get(rawDocs)).toBe('docs');
  });
});

describe('resolveAcrossForests', () => {
  it('keeps items that still exist in the new forest', () => {
    const forest = makeForest();
    const logs = forest[2];
    const resolved = resolveAcrossForests([logs], forest, forest);
    expect(resolved).toEqual([logs]);
  });

  it('resolves items onto an all-new forest by path', () => {
    const forest = makeForest();
    const fresh = cloneForest(forest);
    const docs = forest[0] as IFolder;
    const deep = docs.children[0];

    const resolved = resolveAcrossForests([docs, deep], forest, fresh);
    expect(resolved.map(i => i.name)).toEqual(['docs', 'deep']);
    expect(resolved[0]).toBe(fresh[0]);
    expect(resolved[1]).toBe((fresh[0] as IFolder).children[0]);
  });

  it('drops items whose path no longer exists', () => {
    const forest = makeForest();
    const fresh = cloneForest(forest);
    // The 'empty' folder was removed server-side after being emptied
    fresh.splice(1, 1);
    const empty = forest[1];
    const docs = forest[0];

    const resolved = resolveAcrossForests([docs, empty], forest, fresh);
    expect(resolved.map(i => i.name)).toEqual(['docs']);
  });

  it('keeps the drop target open across a move refresh', () => {
    const forest = makeForest();
    const fresh = cloneForest(forest);
    // logs.txt moved into 'empty', as the refreshed server read reports
    const [logsClone] = fresh.splice(2, 1);
    (fresh[1] as IFolder).children.push(logsClone);

    // opened: the docs chain plus the drop target (old objects)
    const docs = forest[0] as IFolder;
    const opened = [docs, docs.children[0], forest[1]];
    const resolved = resolveAcrossForests(opened, forest, fresh);
    expect(resolved.map(i => i.name)).toEqual(['docs', 'deep', 'empty']);
    expect(resolved[2]).toBe(fresh[1]);
  });

  it('resolves raw items against reactive forests', () => {
    const oldForest = reactive({ children: makeForest() }).children;
    const freshForest = reactive({
      children: cloneForest(oldForest),
    }).children;
    const rawDocs = toRaw(oldForest[0]);

    const resolved = resolveAcrossForests([rawDocs], oldForest, freshForest);
    expect(resolved.map(i => i.name)).toEqual(['docs']);
    expect(resolved[0]).toBe(toRaw(freshForest[0]));
  });
});
