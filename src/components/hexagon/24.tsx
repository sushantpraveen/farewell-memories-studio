import React, { useEffect, useMemo, useRef, useState } from "react";

interface HexCellProps {
  row: number;
  col: number;
  isVisible: boolean;
  active?: boolean;            // NEW
  onClick?: () => void;
}

const HexCell: React.FC<HexCellProps> = ({ row, col, isVisible, active, onClick }) => {
  if (!isVisible) {
    return <div className="w-[60px] h-[52px] sm:w-[80px] sm:h-[69px] lg:w-[100px] lg:h-[87px]" />;
  }

  return (
    <div
      className={`hex-cell hex-cell--cyan ${active ? "hex-cell--active" : ""} cursor-pointer`}
      onClick={onClick}
      data-row={row}
      data-col={col}
      // override the fill when active
      style={{
        background: active ? "#22c55e" : undefined,
        backgroundImage: active ? "none" : undefined,
        zIndex: active ? 10 : undefined,
        borderColor: active ? "#16a34a" : undefined,
      }}
    />
  );
};

const GridBoard: React.FC = () => {
  // rows config (kept as you had it)
  const gridConfig = [
    // { cells: 6, offset: true },
    // { cells: 7, offset: false },
    // { cells: 6, offset: true },
    // { cells: 6, offset: false },
    { cells: 5, offset: true },
    { cells: 6, offset: false },
    { cells: 5, offset: true },
    { cells: 6, offset: false },
    { cells: 5, offset: false },
    { cells: 6, offset: true },
    { cells: 5, offset: false },
    // { cells: 6, offset: true },
    // { cells: 8, offset: true },
    // { cells: 7, offset: false },
    // { cells: 6, offset: false },
  ];

  // track which cells are green
  const keyOf = (r: number, c: number) => `${r}:${c}`;
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>({});

  const isCellVisible = (_rowIndex: number, _colIndex: number): boolean => true;

  const handleCellClick = (row: number, col: number) => {
    const k = keyOf(row, col);
    setActiveMap(prev => ({ ...prev, [k]: !prev[k] })); // toggle green
    console.log(`Clicked hex cell at row ${row + 1}, col ${col + 1}`);
  };

  // Merge specification (0-based indices) matching your request
  const mergePlan: Record<number, { startIdx: number; count: number }> = useMemo(() => ({
    // 3: { startIdx: 3, count: 2 },  // row 4: 4,5
    // 3: { startIdx: 3, count: 1 },  // row 5: 4,5,6
    1: { startIdx: 2, count: 2 },  // row 6: 3-6
    2: { startIdx: 1, count: 3 },  // row 7: 3-7
    3: { startIdx: 1, count: 4 },  // row 8: 2-7
    4: { startIdx: 1, count: 3 },  // row 9: 3-7
    5: { startIdx: 2, count: 2 },  // row 10: 3-6
    // 9: { startIdx: 3, count: 1 }, // row 11: 4-6
    // 11: { startIdx: 3, count: 2 }, // row 12: 4,5
  }), []);

  // ========================================================================
  // SVG MERGED CENTER REGION - GEOMETRY-BASED GAP IMPLEMENTATION
  // ========================================================================
  // 
  // Gap Strategy: We use a WHITE STROKE on the merged region to create 
  // uniform visual gaps. This avoids coordinate mismatches between DOM cells
  // and SVG overlay.
  //
  // Key constants:
  // - HEX_SIZE: radius of each hexagon in SVG coordinates
  // - GAP_STROKE: stroke width that creates visual gap (matches DOM margin)
  // - CENTER_RADIUS: hex distance from origin that defines "center" region
  //
  // IMPORTANT: To adjust gap width, modify GAP_STROKE. Do NOT tune HEX_SIZE
  // for gap purposes - that causes non-uniform gaps in different directions.
  // ========================================================================

  const HEX_SIZE = 28;              // SVG hex radius (base geometric size)
  const GAP_STROKE = 2;             // Stroke width for gap (~1px margin like DOM cells)
  const CENTER_HEX_SIZE = HEX_SIZE; // Center hexes use same size
  const FILL = "#22c55e";           // Green fill
  const BACKGROUND_COLOR = "#f1f5f9"; // Background color for stroke gap (slate-100)

  // TUNABLES for Merge Center Fix
  const INNER_OVERLAP = 1.12;       // Overlap factor for inner underlay hexes
  const INNER_STROKE = 8;           // Stroke width for inner underlay hexes
  const SEAM_STROKE = 14;           // Stroke width for top/bottom seam patches
  const ROW_EPS = 8;                // Tolerance for detecting rows by cy

  // Axial hex distance (proper hex-grid distance, not Euclidean)
  // Uses cube coordinate system: s = -q - r
  const hexDistance = (q1: number, r1: number, q2: number, r2: number) => {
    const s1 = -q1 - r1;
    const s2 = -q2 - r2;
    return Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs(s1 - s2));
  };

  // Define the merged center region using proper axial coordinates
  // Center is at (0,0), we include all hexes within CENTER_RADIUS hex distance
  const CENTER_RADIUS = 2;

  // Generate axial coordinates for the full hex grid area
  const generateAxialGrid = (radius: number) => {
    const cells: Array<{ q: number; r: number }> = [];
    for (let q = -radius; q <= radius; q++) {
      for (let r = -radius; r <= radius; r++) {
        if (hexDistance(q, r, 0, 0) <= radius) {
          cells.push({ q, r });
        }
      }
    }
    return cells;
  };

  // Check if a cell is in the center region
  const isInCenter = (q: number, r: number) => hexDistance(q, r, 0, 0) <= CENTER_RADIUS;

  // Convert axial to pixel coordinates (pointy-top hex)
  const axialToPixelCoord = (q: number, r: number, size: number): [number, number] => {
    const x = size * Math.sqrt(3) * (q + r / 2);
    const y = size * 1.5 * r;
    return [x, y];
  };

  // Generate center cell pixel positions
  const centerCells = useMemo(() => {
    return generateAxialGrid(CENTER_RADIUS)
      .filter(({ q, r }) => isInCenter(q, r))
      .map(({ q, r }) => axialToPixelCoord(q, r, HEX_SIZE));
  }, []);

  // Build hex polygon points string for SVG (pointy-top orientation)
  // No scaling distortion - all hexes have uniform geometry
  const getHexPoints = (cx: number, cy: number, size: number) => {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < 6; i++) {
      // Pointy-top: angles at -90, -30, 30, 90, 150, 210 degrees
      const angle = (-90 + i * 60) * (Math.PI / 180);
      const x = cx + size * Math.cos(angle);
      const y = cy + size * Math.sin(angle);
      pts.push([x, y]);
    }
    return pts.map(([x, y]) => `${x},${y}`).join(" ");
  };


  const [overlaySize, setOverlaySize] = useState({ w: 0, h: 0 });
  // Track the actual DOM positions of hidden cells for SVG alignment
  const [hiddenCellPositions, setHiddenCellPositions] = useState<Array<{ cx: number; cy: number; width: number; height: number }>>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [centerImage, setCenterImage] = useState<string | null>(null);

  // No-op handlers to keep no-drag behavior while satisfying requested structure
  const handleSvgPointerMove = (_e: React.PointerEvent<SVGSVGElement>) => { };
  const endDrag = (_e?: React.PointerEvent<SVGSVGElement>) => { };
  const handleCenterClick = () => {
    console.log('[HexGrid] Center/outer clicked -> opening file picker');
    // Trigger hidden file input for image selection
    fileInputRef.current?.click();
  };
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log('[HexGrid] File selected:', file.name, file.type, file.size);
    const url = URL.createObjectURL(file);
    setCenterImage(url);
    // allow re-selecting the same file later
    e.currentTarget.value = '';
  };

  // Note: axialToPixelCoord is now defined above in the geometry section

  // Measure container size AND hidden cell positions for SVG alignment
  useEffect(() => {
    const measure = () => {
      const root = containerRef.current;
      if (!root) return;

      const containerBox = root.getBoundingClientRect();
      setOverlaySize({ w: Math.round(containerBox.width), h: Math.round(containerBox.height) });

      // Find all center cells that are part of merged region
      // These have data-center="true" attribute
      const centerCellElements = root.querySelectorAll('[data-center="true"]');
      const positions: Array<{ cx: number; cy: number; width: number; height: number }> = [];

      centerCellElements.forEach((cell) => {
        const cellBox = cell.getBoundingClientRect();
        // Convert to container-relative coordinates (SVG viewBox will be set to match container)
        const cx = cellBox.left - containerBox.left + cellBox.width / 2;
        const cy = cellBox.top - containerBox.top + cellBox.height / 2;
        positions.push({
          cx,
          cy,
          width: cellBox.width,
          height: cellBox.height
        });
      });

      setHiddenCellPositions(positions);
    };

    // Initial measure after a small delay to ensure layout is complete
    const timeout = setTimeout(measure, 100);
    const onResize = () => requestAnimationFrame(measure);
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="grid-container">
      <div className="relative" ref={containerRef}>
        <div className="flex flex-col items-center">
          {gridConfig.map((row, rowIndex) => {
            // Merge plan (1-based rows/cols as per request), converted to 0-based indices here
            const spec = mergePlan[rowIndex];

            if (spec && row.cells >= spec.startIdx + spec.count) {
              const pre = Array.from({ length: spec.startIdx });
              const post = Array.from({ length: row.cells - (spec.startIdx + spec.count) });

              return (
                <div key={rowIndex} className={`hex-row ${row.offset ? "offset" : ""}`}>
                  {pre.map((_, colIndex) => {
                    const k = keyOf(rowIndex, colIndex);
                    return (
                      <HexCell
                        key={k}
                        row={rowIndex}
                        col={colIndex}
                        isVisible={isCellVisible(rowIndex, colIndex)}
                        active={!!activeMap[k]}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                      />
                    );
                  })}


                  {/* Center cells - visible with gaps, background layer shows through */}
                  {/* Keep data attributes for DOM position measurement */}
                  {Array.from({ length: spec.count }, (_, i) => {
                    const colIndex = spec.startIdx + i;
                    const k = keyOf(rowIndex, colIndex);
                    return (
                      <div
                        key={k}
                        className="hex-cell hex-cell-center"
                        data-row={rowIndex}
                        data-col={colIndex}
                        data-center="true"
                        style={{
                          // Transparent so background layer shows through gaps
                          background: "transparent",
                          // Remove any border that might cause visible gaps
                          border: "none",
                          pointerEvents: "none"
                        }}
                      />
                    );
                  })}

                  {post.map((_, postIdx) => {
                    const colIndex = spec.startIdx + spec.count + postIdx;
                    const k = keyOf(rowIndex, colIndex);
                    return (
                      <HexCell
                        key={k}
                        row={rowIndex}
                        col={colIndex}
                        isVisible={isCellVisible(rowIndex, colIndex)}
                        active={!!activeMap[k]}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                      />
                    );
                  })}
                </div>
              );
            }

            // Default: no merge in this row
            return (
              <div key={rowIndex} className={`hex-row ${row.offset ? "offset" : ""}`}>
                {Array.from({ length: row.cells }, (_, colIndex) => {
                  const k = keyOf(rowIndex, colIndex);
                  return (
                    <HexCell
                      key={k}
                      row={rowIndex}
                      col={colIndex}
                      isVisible={isCellVisible(rowIndex, colIndex)}
                      active={!!activeMap[k]}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    />
                  );
                })}
              </div>
            );

          })}
        </div>
        {/* ============================================================
            BACKGROUND LAYER (z-index: 1)
            - Sits BEHIND the hex cells
            - Shows through the gaps between center hex cells
            - Provides solid color or image fill for merged center region
            ============================================================ */}
        {overlaySize.w > 0 && overlaySize.h > 0 && hiddenCellPositions.length > 0 && (
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${overlaySize.w} ${overlaySize.h}`}
            style={{ zIndex: 1, pointerEvents: "none" }}
            shapeRendering="geometricPrecision"
          >
            {/* Scaled group to create extra gap between green center and cyan ring */}
            {/* shrinking the whole union preserves internal overlap while pulling edges away from neighbors */}
            <g style={{
              transform: "scale(0.95)",
              transformOrigin: `${overlaySize.w / 2}px ${overlaySize.h / 2}px`
            }}>
              <defs>
                {/* Clip path for background - slight overlap to ensure full coverage */}
                <clipPath id="clip-center-bg" clipPathUnits="userSpaceOnUse">
                  {hiddenCellPositions.map(({ cx, cy, width }, i) => {
                    // 1.3 to ensure robust overlap for solid shape
                    const OVERLAP_FACTOR = 1.30;
                    const hexRadius = (width / 2) * OVERLAP_FACTOR;
                    return (
                      <polygon key={`bg-${i}`} points={getHexPoints(cx, cy, hexRadius)} />
                    );
                  })}
                </clipPath>
              </defs>

              {/* Background fill - visible through gaps in center hex cells */}
              <g clipPath="url(#clip-center-bg)">
                {centerImage ? (
                  <image
                    href={centerImage}
                    x={0}
                    y={0}
                    width={overlaySize.w}
                    height={overlaySize.h}
                    preserveAspectRatio="xMidYMid slice"
                  />
                ) : (
                  <rect
                    x={0}
                    y={0}
                    width={overlaySize.w}
                    height={overlaySize.h}
                    fill={FILL}
                  />
                )}
              </g>
            </g>
          </svg>
        )}

        {/* ============================================================
            OVERLAY LAYER (z-index: 10)
            - Sits ABOVE the hex cells
            - Used ONLY for click handling on the center region
            - Transparent fill, no visual appearance
            ============================================================ */}
        {overlaySize.w > 0 && overlaySize.h > 0 && hiddenCellPositions.length > 0 && (
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${overlaySize.w} ${overlaySize.h}`}
            style={{ zIndex: 10, pointerEvents: "none" }}
          >
            <defs>
              {/* Clip path for click area - matches visible hex size */}
              <clipPath id="clip-center-click" clipPathUnits="userSpaceOnUse">
                {hiddenCellPositions.map(({ cx, cy, width }, i) => {
                  const hexRadius = width / 2;
                  return (
                    <polygon key={`click-${i}`} points={getHexPoints(cx, cy, hexRadius)} />
                  );
                })}
              </clipPath>
            </defs>

            {/* Transparent click target for center region */}
            <g clipPath="url(#clip-center-click)">
              <rect
                x={0}
                y={0}
                width={overlaySize.w}
                height={overlaySize.h}
                fill="transparent"
                style={{ cursor: "pointer", pointerEvents: "auto" }}
                onClick={handleCenterClick}
              />
            </g>
          </svg>
        )}
        {/* Hidden file input for center image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }}
        />
      </div>
    </div>
  );
};

export default GridBoard;


