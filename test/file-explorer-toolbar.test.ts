import { describe, expect, it } from 'vitest';
import {
  countInlineActions,
  getUploadBatchError,
} from '@/components/cz.file-explorer.toolbar';

const layout = { buttonWidth: 40, gap: 4, rows: 2, fixedWidth: 0 };

describe('countInlineActions', () => {
  it('shows every action before the toolbar is measured', () => {
    expect(countInlineActions(8, { ...layout, rowWidth: 0 })).toBe(8);
  });

  it('shows every action when they fit in the allowed rows', () => {
    // 5 slots per row, 2 rows
    expect(countInlineActions(10, { ...layout, rowWidth: 216 })).toBe(10);
  });

  it('reserves a slot for the overflow button when actions do not fit', () => {
    expect(countInlineActions(11, { ...layout, rowWidth: 216 })).toBe(9);
  });

  it('subtracts fixed buttons from the first row only', () => {
    // first row: 2 slots after a 128px button, second row: 5 slots
    expect(
      countInlineActions(12, { ...layout, rowWidth: 216, fixedWidth: 128 })
    ).toBe(6);
  });

  it('respects the row limit', () => {
    expect(countInlineActions(12, { ...layout, rowWidth: 216, rows: 1 })).toBe(
      4
    );
  });

  it('never returns a negative count', () => {
    expect(
      countInlineActions(3, { ...layout, rowWidth: 30, fixedWidth: 200, rows: 1 })
    ).toBe(0);
  });
});

describe('getUploadBatchError', () => {
  const files = (count: number) =>
    Array.from({ length: count }, (_, i) => new File(['x'], `f${i}.txt`));

  it('accepts batches within the limit', () => {
    expect(getUploadBatchError(files(3), 3)).toBeNull();
  });

  it('accepts any batch without a limit', () => {
    expect(getUploadBatchError(files(100))).toBeNull();
  });

  it('rejects batches over the limit', () => {
    expect(getUploadBatchError(files(4), 3)).toMatch(/at most 3 files/);
  });
});
