import { toRaw } from 'vue';
import type { ActiveStrategy } from 'vuetify';
import type { IFile, IFolder } from '@/types';

/** The file explorer state the selection strategy operates on. */
export interface SelectionContext {
  getParent(item: IFile | IFolder): IFolder;
  isFolder(item: IFile | IFolder): boolean;
  open(items: (IFile | IFolder)[]): void;
  getShiftAnchor(): IFile | IFolder | null;
  setShiftAnchor(item: IFile | IFolder | null): void;
}

/**
 * Custom `v-treeview` active strategy implementing file-explorer selection:
 * plain click selects one item, ctrl/cmd click toggles, shift click selects
 * the range between the shift anchor and the clicked item.
 *
 * Vuetify keeps raw (non-reactive) objects in the activated set, so every
 * comparison and every item added here must go through `toRaw`: the tree
 * arrays hold reactive proxies, and a raw item never matches its proxy.
 */
export function createFileExplorerActiveStrategy(
  ctx: SelectionContext
): ActiveStrategy {
  const onItemClick = (
    item: IFolder | IFile,
    activated: Set<IFile | IFolder>
  ) => {
    activated.clear();
    activated.add(item);
    if (ctx.isFolder(item)) {
      ctx.open([item]);
    }
    ctx.setShiftAnchor(item);
  };

  const onItemCtrlClick = (
    item: IFolder | IFile,
    activated: Set<IFile | IFolder>
  ) => {
    if (activated.has(item)) {
      activated.delete(item);
    } else {
      activated.add(item);
    }
    ctx.setShiftAnchor(item);
  };

  const onItemShiftClick = (
    item: IFolder | IFile,
    activated: Set<IFile | IFolder>
  ) => {
    if (!ctx.getShiftAnchor()) {
      ctx.setShiftAnchor(item);
    }
    const children = ctx
      .getParent(item)
      .children.map(child => toRaw(child) as IFile | IFolder);
    const anchor = toRaw(ctx.getShiftAnchor()) as IFile | IFolder;
    const itemIndex = Math.max(0, children.indexOf(item));
    const anchorIndex = Math.max(0, children.indexOf(anchor));

    activated.clear();

    const first = Math.min(itemIndex, anchorIndex);
    const last = Math.max(itemIndex, anchorIndex);

    for (let i = first; i <= last; i++) {
      activated.add(children[i]);
    }
  };

  const strategy: ActiveStrategy = {
    // @ts-ignore
    activate: ({ id, value, activated, children, parents, event }) => {
      id = toRaw(id);

      if (!event && activated.has(id)) return activated;

      const item = id as IFile | IFolder;
      const activatedItems = activated as Set<IFile | IFolder>;

      // @ts-ignore
      if (event?.ctrlKey || event?.metaKey) {
        onItemCtrlClick(item, activatedItems);
        // @ts-ignore
      } else if (event?.shiftKey) {
        onItemShiftClick(item, activatedItems);
      } else {
        onItemClick(item, activatedItems);
      }

      return activated;
    },
    in: (v: any, children: any, parents: any) => {
      let set: Set<IFile | IFolder> = new Set(v.map((i: any) => toRaw(i)));

      if (v != null) {
        for (const id of v) {
          const activated = strategy.activate({
            id,
            value: true,
            activated: new Set(set),
            children,
            parents,
            event: undefined,
          });

          set = new Set([...set, ...activated]) as Set<IFile | IFolder>;
        }
      }
      return set;
    },
    out: (v: any) => {
      return Array.from(v);
    },
  };

  return strategy;
}
