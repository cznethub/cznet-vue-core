/** An action shown in the file explorer toolbar, or in its overflow menu when space runs out. */
export interface FileExplorerAction {
  key: string;
  title: string;
  icon: string;
  color?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

export interface ToolbarLayout {
  /** Width available for buttons in one row, in px. */
  rowWidth: number;
  /** Width already taken in the first row by fixed buttons (e.g. "Add files"), including their trailing gap, in px. */
  fixedWidth: number;
  /** Width of one icon button, in px. */
  buttonWidth: number;
  /** Gap between buttons, in px. */
  gap: number;
  rows: number;
}

/** Number of actions that fit inline; the rest go to the overflow menu, whose button takes one slot. */
export function countInlineActions(
  actionCount: number,
  { rowWidth, fixedWidth, buttonWidth, gap, rows }: ToolbarLayout
): number {
  if (rowWidth <= 0) {
    return actionCount;
  }

  const slot = buttonWidth + gap;
  const fullRow = Math.max(Math.floor((rowWidth + gap) / slot), 1);
  const firstRow = Math.max(
    Math.floor((rowWidth - fixedWidth + gap) / slot),
    0
  );
  const capacity = firstRow + fullRow * Math.max(rows - 1, 0);

  if (actionCount <= capacity) {
    return actionCount;
  }
  return Math.max(capacity - 1, 0);
}

/** Returns why a batch of files cannot be uploaded at once, or `null` if it can. */
export function getUploadBatchError(
  files: File[],
  maxFiles?: number
): string | null {
  if (maxFiles && files.length > maxFiles) {
    return `You can upload at most ${maxFiles} files at a time. ${files.length} files were selected.`;
  }
  return null;
}
