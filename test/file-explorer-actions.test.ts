import { describe, expect, it, vi } from 'vitest';
import type {
  IFile,
  IFileExplorerAction,
  IFileExplorerActionContext,
  IFolder,
} from '@/types';
import {
  contextMenuActions,
  isActionEnabled,
  isActionPlaced,
} from '@/components/cz.file-explorer.actions';

const root = { name: '', children: [] } as unknown as IFolder;
const file = { name: 'a.txt', file: null } as unknown as IFile;
const context: IFileExplorerActionContext = {
  folder: root,
  folderPath: '',
  source: 'context-menu',
};

const action = (
  key: string,
  extra: Partial<IFileExplorerAction> = {}
): IFileExplorerAction => ({
  key,
  label: key,
  icon: 'mdi-star',
  handler: () => {},
  ...extra,
});

describe('isActionPlaced', () => {
  it('places actions in both menus by default', () => {
    expect(isActionPlaced(action('a'), 'toolbar')).toBe(true);
    expect(isActionPlaced(action('a'), 'context-menu')).toBe(true);
  });

  it('honors opting out of a menu', () => {
    expect(isActionPlaced(action('a', { toolbar: false }), 'toolbar')).toBe(
      false
    );
    expect(
      isActionPlaced(action('a', { contextMenu: false }), 'context-menu')
    ).toBe(false);
  });
});

describe('isActionEnabled', () => {
  it('is enabled without a predicate', () => {
    expect(isActionEnabled(action('a'), [], context)).toBe(true);
  });

  it('passes the items and context to the predicate', () => {
    const isEnabled = vi.fn(() => false);
    expect(isActionEnabled(action('a', { isEnabled }), [file], context)).toBe(
      false
    );
    expect(isEnabled).toHaveBeenCalledWith([file], context);
  });
});

describe('contextMenuActions', () => {
  it('keeps actions placed in the context menu that apply to the items', () => {
    const actions = [
      action('always'),
      action('toolbar-only', { contextMenu: false }),
      action('single', { isEnabled: items => items.length === 1 }),
    ];

    expect(contextMenuActions(actions, [file], context).map(a => a.key)).toEqual(
      ['always', 'single']
    );
    expect(contextMenuActions(actions, [], context).map(a => a.key)).toEqual([
      'always',
    ]);
  });
});
