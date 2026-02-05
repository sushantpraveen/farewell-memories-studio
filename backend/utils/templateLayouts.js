/**
 * Template layouts for server-side rendering (mirrors src/templates/layouts.ts)
 * Each enumerate function yields slot specifications for placing members
 */

/**
 * Enumerate layout for 12-member template
 */
export function enumerate12() {
  const slots = [];
  // Top row (3 cells)
  for (let c = 0; c < 3; c++) {
    slots.push({ kind: 'top', index: c, r: 0, c: 1.5 + c, rspan: 1, cspan: 1 });
  }
  // Left side (3 cells)
  for (let r = 0; r < 3; r++) {
    slots.push({ kind: 'left', index: 3 + r, r: 1.5 + r, c: 0, rspan: 1, cspan: 1 });
  }
  // Center
  slots.push({ kind: 'center', index: -1, r: 1, c: 1, rspan: 4, cspan: 4 });
  // Right side (3 cells)
  for (let r = 0; r < 3; r++) {
    slots.push({ kind: 'right', index: 6 + r, r: 1.5 + r, c: 5, rspan: 1, cspan: 1 });
  }
  // Bottom row (3 cells)
  for (let c = 0; c < 3; c++) {
    slots.push({ kind: 'bottom', index: 9 + c, r: 5, c: 1.5 + c, rspan: 1, cspan: 1 });
  }
  return { slots, cols: 6, rows: 6 };
}

/**
 * Enumerate layout for 18-member template
 */
export function enumerate18() {
  const slots = [];
  // Top row (4 cells)
  for (let c = 0; c < 4; c++) {
    slots.push({ kind: 'top', index: c, r: 0, c: 1 + c, rspan: 1, cspan: 1 });
  }
  // Left side (5 cells)
  for (let r = 0; r < 5; r++) {
    slots.push({ kind: 'left', index: 4 + r, r: 1 + r, c: 0, rspan: 1, cspan: 1 });
  }
  // Center
  slots.push({ kind: 'center', index: -1, r: 1, c: 1, rspan: 5, cspan: 4 });
  // Right side (5 cells)
  for (let r = 0; r < 5; r++) {
    slots.push({ kind: 'right', index: 9 + r, r: 1 + r, c: 5, rspan: 1, cspan: 1 });
  }
  // Bottom row (4 cells)
  for (let c = 0; c < 4; c++) {
    slots.push({ kind: 'bottom', index: 14 + c, r: 6, c: 1 + c, rspan: 1, cspan: 1 });
  }
  return { slots, cols: 6, rows: 7 };
}

/**
 * Enumerate layout for 19-member template
 */
export function enumerate19() {
  const slots = [];
  // Top row (4 cells)
  for (let c = 0; c < 4; c++) {
    slots.push({ kind: 'top', index: c, r: 0, c: 1 + c, rspan: 1, cspan: 1 });
  }
  // Left side (5 cells)
  for (let r = 0; r < 5; r++) {
    slots.push({ kind: 'left', index: 4 + r, r: 1 + r, c: 0, rspan: 1, cspan: 1 });
  }
  // Center
  slots.push({ kind: 'center', index: -1, r: 1, c: 1, rspan: 5, cspan: 4 });
  // Right side (5 cells)
  for (let r = 0; r < 5; r++) {
    slots.push({ kind: 'right', index: 9 + r, r: 1 + r, c: 5, rspan: 1, cspan: 1 });
  }
  // Bottom row (5 cells)
  for (let c = 0; c < 5; c++) {
    slots.push({ kind: 'bottom', index: 14 + c, r: 6, c: 0.5 + c, rspan: 1, cspan: 1 });
  }
  return { slots, cols: 6, rows: 7 };
}

/**
 * Enumerate layout for 20-member template
 */
export function enumerate20() {
  const slots = [];
  // Top row (5 cells)
  for (let c = 0; c < 5; c++) {
    slots.push({ kind: 'top', index: c, r: 0, c: 1 + c, rspan: 1, cspan: 1 });
  }
  // Left side (5 cells)
  for (let r = 0; r < 5; r++) {
    slots.push({ kind: 'left', index: 5 + r, r: 1 + r, c: 0, rspan: 1, cspan: 1 });
  }
  // Center
  slots.push({ kind: 'center', index: -1, r: 1, c: 1, rspan: 5, cspan: 5 });
  // Right side (5 cells)
  for (let r = 0; r < 5; r++) {
    slots.push({ kind: 'right', index: 10 + r, r: 1 + r, c: 6, rspan: 1, cspan: 1 });
  }
  // Bottom row (5 cells)
  for (let c = 0; c < 5; c++) {
    slots.push({ kind: 'bottom', index: 15 + c, r: 6, c: 1 + c, rspan: 1, cspan: 1 });
  }
  return { slots, cols: 7, rows: 7 };
}

/**
 * Enumerate layout for 33-member template
 */
export function enumerate33() {
  const slots = [];
  // Top row (8 cells)
  for (let c = 0; c < 8; c++) {
    slots.push({ kind: 'top', index: c, r: 0, c, rspan: 1, cspan: 1 });
  }
  // Left side (4 cells)
  for (let r = 0; r < 4; r++) {
    slots.push({ kind: 'left', index: 8 + r, r: 1 + r, c: 0, rspan: 1, cspan: 1 });
  }
  // Center
  slots.push({ kind: 'center', index: -1, r: 1, c: 1, rspan: 4, cspan: 6 });
  // Right side (4 cells)
  for (let r = 0; r < 4; r++) {
    slots.push({ kind: 'right', index: 12 + r, r: 1 + r, c: 7, rspan: 1, cspan: 1 });
  }
  // Bottom row (8 cells)
  for (let c = 0; c < 8; c++) {
    slots.push({ kind: 'bottom', index: 16 + c, r: 5, c, rspan: 1, cspan: 1 });
  }
  // Bottom extension (8 cells)
  for (let c = 0; c < 8; c++) {
    slots.push({ kind: 'bottomExt', index: 24 + c, r: 6, c, rspan: 1, cspan: 1 });
  }
  // Bottom-most (1 cell centered)
  slots.push({ kind: 'bottomMostExt', index: 32, r: 7, c: 3.5, rspan: 1, cspan: 1 });
  return { slots, cols: 8, rows: 8 };
}

/**
 * Enumerate layout for 45-member template
 */
export function enumerate45() {
  const slots = [];
  // Top extension most (8 cells)
  for (let i = 0; i < 8; i++) {
    slots.push({ kind: 'topExtMost', index: 37 + i, r: 0, c: i, rspan: 1, cspan: 1 });
  }
  // Top row (8 cells)
  for (let c = 0; c < 8; c++) {
    slots.push({ kind: 'top', index: c, r: 1, c, rspan: 1, cspan: 1 });
  }
  // Left side (5 cells)
  for (let r = 0; r < 5; r++) {
    slots.push({ kind: 'left', index: 8 + r, r: 2 + r, c: 0, rspan: 1, cspan: 1 });
  }
  // Center
  slots.push({ kind: 'center', index: -1, r: 2, c: 1, rspan: 5, cspan: 6 });
  // Right side (5 cells)
  for (let r = 0; r < 5; r++) {
    slots.push({ kind: 'right', index: 13 + r, r: 2 + r, c: 7, rspan: 1, cspan: 1 });
  }
  // Bottom row (8 cells)
  for (let c = 0; c < 8; c++) {
    slots.push({ kind: 'bottom', index: 18 + c, r: 7, c, rspan: 1, cspan: 1 });
  }
  // Bottom extension (8 cells)
  for (let c = 0; c < 8; c++) {
    slots.push({ kind: 'bottomExt', index: 26 + c, r: 8, c, rspan: 1, cspan: 1 });
  }
  // Bottom-most extension (3 cells, centered)
  for (let i = 0; i < 3; i++) {
    slots.push({ kind: 'bottomMostExt', index: 34 + i, r: 9, c: 2.5 + i, rspan: 1, cspan: 1 });
  }
  return { slots, cols: 8, rows: 10 };
}

/**
 * Get layout for a given member count
 */
export function getLayoutForMemberCount(memberCount) {
  // Map member counts to their enumerate functions
  const layoutMap = {
    12: enumerate12,
    13: enumerate12, // Use 12 layout
    14: enumerate12,
    15: enumerate12,
    16: enumerate18, // Use 18 layout for 16-17
    17: enumerate18,
    18: enumerate18,
    19: enumerate19,
    20: enumerate20,
    21: enumerate20,
    22: enumerate20,
    23: enumerate20,
    33: enumerate33,
    34: enumerate33,
    35: enumerate33,
    45: enumerate45,
  };

  // Find closest matching layout
  if (layoutMap[memberCount]) {
    return layoutMap[memberCount]();
  }

  // Default to 45 for larger groups, or 18 for smaller
  if (memberCount >= 36) {
    return enumerate45();
  } else if (memberCount >= 24) {
    return enumerate33();
  } else if (memberCount >= 19) {
    return enumerate20();
  } else {
    return enumerate18();
  }
}

/**
 * Calculate pixel positions for a layout
 * @param {Object} layout - Layout from enumerate function
 * @param {number} canvasWidth - Canvas width in pixels
 * @param {number} canvasHeight - Canvas height in pixels
 * @param {number} gap - Gap between cells in pixels
 * @returns {Array} Array of cell positions with x, y, width, height
 */
export function calculateCellPositions(layout, canvasWidth, canvasHeight, gap = 4) {
  const { slots, cols, rows } = layout;
  
  // Calculate cell dimensions
  const cellW = (canvasWidth - (cols + 1) * gap) / cols;
  const cellH = (canvasHeight - (rows + 1) * gap) / rows;

  return slots.map(slot => {
    const rspan = slot.rspan || 1;
    const cspan = slot.cspan || 1;
    
    // Handle fractional column positions (for centered cells)
    const effectiveCol = slot.c;
    const effectiveRow = slot.r;
    
    const x = gap + effectiveCol * (cellW + gap);
    const y = gap + effectiveRow * (cellH + gap);
    const w = cspan * cellW + (cspan - 1) * gap;
    const h = rspan * cellH + (rspan - 1) * gap;

    return {
      ...slot,
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(w),
      height: Math.round(h)
    };
  });
}
