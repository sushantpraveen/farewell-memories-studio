export type SlotKind =
  | 'topExtMost'
  | 'top'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom'
  | 'bottomExt'
  | 'bottomMostExt';

export type SlotSpec = {
  kind: SlotKind;
  index: number; // -1 means center member
  r: number; // grid row index used by renderer (virtual rows per template)
  c: number; // grid col index (can be fractional for centered small rows)
  rspan?: number;
  cspan?: number;
};

export type EnumerateCallback = (slot: SlotSpec) => Promise<void> | void;

// 45 template: 8 columns x 11 rows (virtual), center spans 6x5
// Indices mapping:
// 0..7   -> top row
// 8..12  -> left border (rows 1..5)
// 13..17 -> right border (rows 1..5)
// 18..25 -> bottom row
// 26..33 -> bottom extension (8)
// 34..36 -> bottom-most extension (3)
// 37..44 -> topExt-most (8)
export async function enumerate45(cb: EnumerateCallback) {
  // 1) Top extension most (8 cells) – row 1
  for (let i = 0; i < 8; i++) {
    await cb({ kind: 'topExtMost', index: 37 + i, r: 1, c: i });
  }
  // 2) Top row (8 cells) – row 2
  for (let c = 0; c < 8; c++) {
    await cb({ kind: 'top', index: c, r: 2, c });
  }
  // 3) Left side (5 cells) – rows 3..7 at col 0
  for (let r = 0; r < 5; r++) {
    await cb({ kind: 'left', index: 8 + r, r: 3 + r, c: 0 });
  }
  // 4) Center (spans 6x5) – starts at row 3, col 1
  await cb({ kind: 'center', index: -1, r: 3, c: 1, rspan: 5, cspan: 6 });
  // 5) Right side (5 cells) – rows 3..7 at col 7
  for (let r = 0; r < 5; r++) {
    await cb({ kind: 'right', index: 13 + r, r: 3 + r, c: 7 });
  }
  // 6) Bottom row (8 cells) – row 8
  for (let c = 0; c < 8; c++) {
    await cb({ kind: 'bottom', index: 18 + c, r: 8, c });
  }
  // 7) Bottom extension (8 cells) – row 9
  for (let c = 0; c < 8; c++) {
    await cb({ kind: 'bottomExt', index: 26 + c, r: 9, c });
  }
  // 8) Bottom-most extension (3 cells, centered) – row 10, cols 2.5..4.5
  for (let i = 0; i < 3; i++) {
    await cb({ kind: 'bottomMostExt', index: 34 + i, r: 10, c: 2.5 + i });
  }
}
