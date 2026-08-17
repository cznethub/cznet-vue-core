import { describe, expect, it } from 'vitest';
import { reactive, toRaw } from 'vue';
import {
  createFileExplorerActiveStrategy,
  SelectionContext,
} from '../src/components/cz.file-explorer.selection';
import { IFile, IFolder } from '../src/types';

let keyCounter = 0;

function file(name: string): IFile {
  return { name, key: keyCounter++, file: null, isUploaded: true };
}

function folder(name: string, children: (IFile | IFolder)[] = []): IFolder {
  return { name, key: keyCounter++, children };
}

function isFolder(item: IFile | IFolder): boolean {
  return Object.prototype.hasOwnProperty.call(item, 'children');
}

/**
 * Test double mirroring how CzFileExplorer provides the context: the tree and
 * the anchor live in reactive state (so reads return proxies), while vuetify
 * hands the strategy raw items.
 */
function makeContext(root: IFolder) {
  const state = reactive({ root, anchor: null as IFile | IFolder | null });
  const opened: string[] = [];

  const allFolders = (dir: IFolder): IFolder[] => {
    const folders = dir.children.filter(isFolder) as IFolder[];
    return [...folders, ...folders.flatMap(allFolders)];
  };

  const ctx: SelectionContext = {
    getParent: item => {
      const target = toRaw(item);
      return (
        allFolders(state.root).find(f =>
          f.children?.some(child => toRaw(child) === target)
        ) || state.root
      );
    },
    isFolder,
    open: items => opened.push(...items.map(i => i.name)),
    getShiftAnchor: () => state.anchor,
    setShiftAnchor: item => (state.anchor = item),
  };

  return { ctx, state, opened };
}

function activate(
  strategy: any,
  id: IFile | IFolder,
  event: Partial<MouseEvent> | undefined,
  activated: Set<IFile | IFolder> = new Set()
): Set<IFile | IFolder> {
  return strategy.activate({
    id,
    value: true,
    activated,
    children: new Map(),
    parents: new Map(),
    event,
  });
}

function names(set: Set<IFile | IFolder>): string[] {
  return [...set].map(i => i && i.name);
}

describe('createFileExplorerActiveStrategy', () => {
  // Mirrors the playground/landing-page structure: a folder with files,
  // an empty folder, and loose files at the root.
  function makeTree() {
    const docs = folder('docs', [
      file('readme.txt'),
      file('presentation.ppt'),
      file('report.pdf'),
    ]);
    const root = folder('root', [
      docs,
      folder('empty'),
      file('logs.txt'),
      file('landscape.png'),
    ]);
    return { root, docs };
  }

  describe('plain click', () => {
    it('replaces the selection and sets the anchor', () => {
      const { root } = makeTree();
      const { ctx, state } = makeContext(root);
      const strategy = createFileExplorerActiveStrategy(ctx);
      const [, , logs, landscape] = root.children;

      let activated = activate(strategy, logs, {}, new Set([landscape]));
      expect(names(activated)).toEqual(['logs.txt']);
      expect(toRaw(state.anchor)).toBe(logs);
    });

    it('opens a clicked folder', () => {
      const { root, docs } = makeTree();
      const { ctx, opened } = makeContext(root);
      const strategy = createFileExplorerActiveStrategy(ctx);

      activate(strategy, docs, {});
      expect(opened).toEqual(['docs']);
    });
  });

  describe('ctrl/cmd click', () => {
    it('toggles items in and out and moves the anchor', () => {
      const { root } = makeTree();
      const { ctx, state } = makeContext(root);
      const strategy = createFileExplorerActiveStrategy(ctx);
      const [, , logs, landscape] = root.children;

      let activated = activate(strategy, logs, { ctrlKey: true });
      activated = activate(strategy, landscape, { ctrlKey: true }, activated);
      expect(names(activated)).toEqual(['logs.txt', 'landscape.png']);
      expect(toRaw(state.anchor)).toBe(landscape);

      activated = activate(strategy, logs, { ctrlKey: true }, activated);
      expect(names(activated)).toEqual(['landscape.png']);
    });

    it('treats cmd (metaKey) like ctrl for macOS', () => {
      const { root } = makeTree();
      const { ctx } = makeContext(root);
      const strategy = createFileExplorerActiveStrategy(ctx);
      const [, , logs, landscape] = root.children;

      let activated = activate(strategy, logs, { metaKey: true });
      activated = activate(strategy, landscape, { metaKey: true }, activated);
      expect(names(activated)).toEqual(['logs.txt', 'landscape.png']);
    });
  });

  describe('shift click', () => {
    it('selects the range between the anchor and the clicked item', () => {
      const { root } = makeTree();
      const { ctx } = makeContext(root);
      const strategy = createFileExplorerActiveStrategy(ctx);
      const [docs, , logs] = root.children;

      let activated = activate(strategy, docs, {});
      activated = activate(strategy, logs, { shiftKey: true }, activated);
      expect(names(activated)).toEqual(['docs', 'empty', 'logs.txt']);
    });

    it('selects the range when clicking above the anchor', () => {
      const { root } = makeTree();
      const { ctx, state } = makeContext(root);
      const strategy = createFileExplorerActiveStrategy(ctx);
      const [docs, , logs] = root.children;

      let activated = activate(strategy, logs, {});
      activated = activate(strategy, docs, { shiftKey: true }, activated);
      expect(names(activated)).toEqual(['docs', 'empty', 'logs.txt']);
      // The anchor stays put so another shift click re-ranges from it
      expect(toRaw(state.anchor)).toBe(logs);
    });

    it('anchors at the clicked item when there is no anchor yet', () => {
      const { root } = makeTree();
      const { ctx, state } = makeContext(root);
      const strategy = createFileExplorerActiveStrategy(ctx);
      const [, , logs, landscape] = root.children;

      let activated = activate(strategy, logs, { shiftKey: true });
      expect(names(activated)).toEqual(['logs.txt']);
      expect(toRaw(state.anchor)).toBe(logs);

      activated = activate(strategy, landscape, { shiftKey: true }, activated);
      expect(names(activated)).toEqual(['logs.txt', 'landscape.png']);
    });

    it('ranges from the top of the folder when the anchor lives elsewhere', () => {
      const { root, docs } = makeTree();
      const { ctx } = makeContext(root);
      const strategy = createFileExplorerActiveStrategy(ctx);
      const landscape = root.children[3];
      const presentation = docs.children[1];

      let activated = activate(strategy, landscape, {});
      activated = activate(strategy, presentation, { shiftKey: true }, activated);
      expect(names(activated)).toEqual(['readme.txt', 'presentation.ppt']);
    });

    it('resolves ranges when vuetify passes raw items but the tree is reactive', () => {
      // This is the production condition: the consumer's rootDirectory is
      // deep-reactive, while vuetify normalizes every id with toRaw. A plain
      // indexOf across the two identities never matches and used to produce
      // ranges anchored at -1 with undefined members.
      const { root, docs } = makeTree();
      const { ctx } = makeContext(root);
      const strategy = createFileExplorerActiveStrategy(ctx);
      const rawReadme = toRaw(docs.children[0]);
      const rawReport = toRaw(docs.children[2]);

      let activated = activate(strategy, rawReadme, {});
      activated = activate(strategy, rawReport, { shiftKey: true }, activated);

      expect(names(activated)).toEqual([
        'readme.txt',
        'presentation.ppt',
        'report.pdf',
      ]);
      for (const item of activated) {
        expect(item).toBeDefined();
        // Members must be raw so vuetify's own toRaw-based lookups match
        expect(toRaw(item)).toBe(item);
      }
    });
  });

  describe('model sync (in/out)', () => {
    it('in() keeps membership without side effects', () => {
      const { root } = makeTree();
      const { ctx, state, opened } = makeContext(root);
      const strategy = createFileExplorerActiveStrategy(ctx);
      const [docs, , logs] = root.children;

      const set = (strategy as any).in([docs, logs], new Map(), new Map());
      expect(names(set)).toEqual(['docs', 'logs.txt']);
      expect(opened).toEqual([]);
      expect(state.anchor).toBeNull();
    });

    it('out() returns the set as an array', () => {
      const { root } = makeTree();
      const { ctx } = makeContext(root);
      const strategy = createFileExplorerActiveStrategy(ctx);
      const [, , logs] = root.children;

      expect((strategy as any).out(new Set([logs]))).toEqual([logs]);
    });
  });
});
