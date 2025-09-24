
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {useGrid} from './context/GridContext';

interface CellImage {
  [key: string]: string;
}

const GridBoard = () => {
  const {
    cellImages,
    isDownloading,
    getCellStyle,
    startDrag,
    handleCellActivate,
    downloadImage,
  } = useGrid();

  // Responsive breakpoint check for desktop
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    // Treat >=1024px as PC/desktop
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      const matches = 'matches' in e ? e.matches : (e as MediaQueryList).matches;
      setIsDesktop(matches);
    };
    // Initialize
    setIsDesktop(mq.matches);
    // Subscribe
    if (mq.addEventListener) {
      mq.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
    } else {
      // Safari fallback
      // @ts-ignore
      mq.addListener(handler);
    }
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
      } else {
        // @ts-ignore
        mq.removeListener(handler);
      }
    };
  }, []);

  // Unique component-scoped ID helpers
  const COMP_ID = 'grid-75';
  const cid = (section: string, row: number, col: number) => `${COMP_ID}:${section}:${row}-${col}`;

  const handleCellClick = (cellKey: string) => handleCellActivate(cellKey);

  // Canvas helpers and renderer for this 11x11 layout
  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const drawImageCover = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ) => {
    const sRatio = img.width / img.height;
    const dRatio = dw / dh;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (sRatio > dRatio) {
      sh = img.height;
      sw = sh * dRatio;
      sx = (img.width - sw) / 2;
    } else {
      sw = img.width;
      sh = sw / dRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  };

  const buildAndDownload = async () => {
    if (!Object.keys(cellImages).length) {
      toast.error('Please upload at least one image before downloading.');
      return;
    }

    try {
      await downloadImage('template-75.png', {
        cols: 11,
        rows: 11,
        // Target physical size for print within requested ranges
        targetWidthIn: 8.5,
        targetHeightIn: 12.5,
        dpi: 300,
        desiredGapPx: 4,
        draw: async ({ drawKey, ctx, width, height }) => {
          // Calculate cell dimensions
          const cellWidth = width / 11;
          const cellHeight = height / 11;

          // 1) Top row (11 cells) at row 0
          for (let c = 0; c < 11; c++) {
            await drawKey(cid('top', 0, c), 0, c);
          }

          // 2) Left border (3 cols x 5 rows) at cols 0,1,2; rows 1..5
          for (let r = 0; r < 5; r++) {
            await drawKey(cid('left', r, 0), 1 + r, 0);
            await drawKey(cid('left', r, 1), 1 + r, 1);
            await drawKey(cid('left', r, 2), 1 + r, 2);
          }

          // 3) Center (5x5) starting at row 1, col 3
          await drawKey(cid('center', 0, 0), 1, 3, 5, 5);

          // 4) Right border (3 cols x 5 rows) at cols 8,9,10; rows 1..5
          for (let r = 0; r < 5; r++) {
            await drawKey(cid('right', r, 0), 1 + r, 8);
            await drawKey(cid('right', r, 1), 1 + r, 9);
            await drawKey(cid('right', r, 2), 1 + r, 10);
          }

          // 5) Bottom row (11 cells) at row 6
          for (let c = 0; c < 11; c++) {
            await drawKey(cid('bottom', 9, c), 6, c, 1, 1);
          }
        },
      });
      toast.success('Template downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download template. Please try again.');
    }


    
  };

  const handleDownload = buildAndDownload;

  // Listen to a global download trigger from the parent preview container
  useEffect(() => {
    const onDownload = async () => {
      try {
        await handleDownload();
      } catch (error) {
        console.error('Download handler error:', error);
        toast.error('Failed to process download request');
      }
    };
    window.addEventListener('grid-template-download', onDownload);
    return () => window.removeEventListener('grid-template-download', onDownload);
  }, [handleDownload]);


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-2 md:p-6">

      <div
        className="grid grid-cols-11 bg-white rounded-xl shadow-2xl p-1 md:p-3 sm:-ml-4"
        style={{
          gap: 'var(--gap)',
          // 10 gaps across 11 cols
          // cell = min(fit width, fit height)
          // ratio keeps cells slightly taller than wide
          // pad approximates container padding on mobile
          ['--gap' as any]: '2px',
          ['--pad' as any]: '8px',
          ['--cell' as any]: isDesktop
            ? 'min(calc((35vw - (var(--pad)*2) - (10 * var(--gap))) / 11), calc((100vh - (var(--pad)*2) - (10 * var(--gap))) / 11))'
            : 'min(calc((100vw - (var(--pad)*2) - (10 * var(--gap))) / 11), calc((100vh - (var(--pad)*2) - (10 * var(--gap))) / 11))',
          ['--ratio' as any]: '1.2',
          ['--row' as any]: 'calc(var(--cell) * var(--ratio))',
          gridAutoRows: 'var(--row)',
          gridTemplateColumns: 'repeat(11, var(--cell))'
        } as React.CSSProperties}
      >

  {/* Top extension - 1 cells centered (non-intrusive full-row) */}
  <div className="col-span-11">
         <div
            className="grid"
            style={{
              display: 'grid',
              gap: 'var(--gap)',
              gridAutoFlow: 'column',
              gridAutoColumns: 'var(--cell)',
              gridAutoRows: 'var(--row)',
              justifyContent: 'center',
            } as React.CSSProperties}
          >
          {Array.from({ length: 9 }, (_, colIndex) => {
            const cellKey = cid('topExt', -1, colIndex + 2);
            return (
              <div
                key={cellKey}
                className="grid-cell active:animate-grid-pulse relative overflow-hidden cursor-pointer"
                style={{ ...(getCellStyle(cellKey) as any) }}
                onClick={() => handleCellClick(cellKey)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCellClick(cellKey);
                  }
                }}
              >
                {!cellImages[cellKey] && (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium opacity-70">
                    +
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>

         {/* Top extension - 1 cells centered (non-intrusive full-row) */}
         <div className="col-span-11">
         <div
            className="grid"
            style={{
              display: 'grid',
              gap: 'var(--gap)',
              gridAutoFlow: 'column',
              gridAutoColumns: 'var(--cell)',
              gridAutoRows: 'var(--row)',
              justifyContent: 'center',
            } as React.CSSProperties}
          >
          {Array.from({ length: 11 }, (_, colIndex) => {
            const cellKey = cid('topExt', -1, colIndex + 2);
            return (
              <div
                key={cellKey}
                className="grid-cell active:animate-grid-pulse relative overflow-hidden cursor-pointer"
                style={{ ...(getCellStyle(cellKey) as any) }}
                onClick={() => handleCellClick(cellKey)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCellClick(cellKey);
                  }
                }}
              >
                {!cellImages[cellKey] && (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium opacity-70">
                    +
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
        
         {/* Top extension - 1 cells centered (non-intrusive full-row) */}
         <div className="col-span-11">
         <div
            className="grid"
            style={{
              display: 'grid',
              gap: 'var(--gap)',
              gridAutoFlow: 'column',
              gridAutoColumns: 'var(--cell)',
              gridAutoRows: 'var(--row)',
              justifyContent: 'center',
            } as React.CSSProperties}
          >
          {Array.from({ length: 11 }, (_, colIndex) => {
            const cellKey = cid('topExt', -1, colIndex + 2);
            return (
              <div
                key={cellKey}
                className="grid-cell active:animate-grid-pulse relative overflow-hidden cursor-pointer"
                style={{ ...(getCellStyle(cellKey) as any) }}
                onClick={() => handleCellClick(cellKey)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCellClick(cellKey);
                  }
                }}
              >
                {!cellImages[cellKey] && (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium opacity-70">
                    +
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* Middle rows (5) with 3-col left/right borders and 5-col center */}
        {Array.from({ length: 5 }, (_, rowIndex) => (
          <React.Fragment key={`middle-row-${rowIndex}`}>
            {/* Left border cell */}
            {/* <div className="col-span-2">
            <div
              className="grid-cell active:animate-grid-pulse relative overflow-hidden cursor-pointer"
              style={{ ...(getCellStyle(cid('left', rowIndex + 1, 0)) as any) }}
              onClick={() => handleCellClick(cid('left', rowIndex + 1, 0))}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCellClick(cid('left', rowIndex + 1, 0));
                }
              }}
            >
              {!cellImages[cid('left', rowIndex + 1, 0)] && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium opacity-70">
                  +
                </div>
              )}
            </div>
            </div> */}

            {/* Left 3 columns */}
            <div className="col-span-3 grid grid-cols-3" style={{ gap: 'var(--gap)' } as React.CSSProperties}>
              {Array.from({ length: 3 }, (_, colIndex) => (
                <div
                  key={`left-side-${colIndex}`}
                  className="grid-cell active:animate-grid-pulse relative overflow-hidden cursor-pointer"
                  style={getCellStyle(cid('left', rowIndex, colIndex))}
                  onClick={() => handleCellClick(cid('left', rowIndex, colIndex))}
                  role="button"
                  tabIndex={0}
                >
                  {!cellImages[cid('left', rowIndex, colIndex)] && (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium opacity-70">
                      +
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Center cell - span 5 columns over 5 rows */}
            {rowIndex === 0 && (
              <div
                className="col-span-5 row-span-5 grid-cell active:animate-grid-pulse flex items-center justify-center text-white font-bold text-lg relative overflow-hidden"
                style={getCellStyle(cid('center', 0, 0))}
                onClick={() => handleCellClick(cid('center', 0, 0))}
                role="button"
                tabIndex={0}
              >
                {!cellImages[cid('center', 0, 0)] && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span>CENTER</span>
                  </div>
                )}
              </div>
            )}

            {/* Right 3 columns */}
            <div className="col-span-3 grid grid-cols-3" style={{ gap: 'var(--gap)' } as React.CSSProperties}>
              {Array.from({ length: 3 }, (_, colIndex) => (
                <div
                  key={`right-side-${colIndex}`}
                  className="grid-cell active:animate-grid-pulse relative overflow-hidden cursor-pointer"
                  style={getCellStyle(cid('right', rowIndex, colIndex))}
                  onClick={() => handleCellClick(cid('right', rowIndex, colIndex))}
                  role="button"
                  tabIndex={0}
                >
                  {!cellImages[cid('right', rowIndex, colIndex)] && (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium opacity-70">
                      +
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right border cell */}
            {/* <div className="col-span-2">
            <div
              className="grid-cell active:animate-grid-pulse relative overflow-hidden cursor-pointer"
              style={{ ...(getCellStyle(cid('right', rowIndex + 1, 7)) as any) }}
              onClick={() => handleCellClick(cid('right', rowIndex + 1, 7))}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCellClick(cid('right', rowIndex + 1, 7));
                }
              }}
            >
              {!cellImages[cid('right', rowIndex + 1, 7)] && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium opacity-70">
                  +
                </div>
              )}
            </div>
            </div> */}
          </React.Fragment>
        ))}

        {/* Bottom extension - 4 cells centered */}
        <div className="col-span-11">
          <div
            className="grid"
            style={{
              display: 'grid',
              gap: 'var(--gap)',
              gridAutoFlow: 'column',
              gridAutoColumns: 'var(--cell)',
              gridAutoRows: 'var(--row)',
              justifyContent: 'center',
            } as React.CSSProperties}
          >
            {Array.from({ length: 11 }, (_, colIndex) => {
              const key = cid('bottom-most-extension', -1, colIndex + 2);
              return (
                <div
                key={key}
                className="grid-cell active:animate-grid-pulse relative overflow-hidden cursor-pointer"
                style={{ ...(getCellStyle(key) as any) }}
                onMouseDown={(e) => startDrag(e, key)}
                onTouchStart={(e) => startDrag(e, key)}
                onClick={() => handleCellActivate(key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCellActivate(key);
                  }
                }}
              >
                {!cellImages[key] && (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium opacity-70">
                    +
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* Bottom extension - 4 cells centered */}
        <div className="col-span-11">
          <div
            className="grid"
            style={{
              display: 'grid',
              gap: 'var(--gap)',
              gridAutoFlow: 'column',
              gridAutoColumns: 'var(--cell)',
              gridAutoRows: 'var(--row)',
              justifyContent: 'center',
            } as React.CSSProperties}
          >
            {Array.from({ length: 11 }, (_, colIndex) => {
              const key = cid('bottom-most-extension', -1, colIndex + 2);
              return (
                <div
                key={key}
                className="grid-cell active:animate-grid-pulse relative overflow-hidden cursor-pointer"
                style={{ ...(getCellStyle(key) as any) }}
                onMouseDown={(e) => startDrag(e, key)}
                onTouchStart={(e) => startDrag(e, key)}
                onClick={() => handleCellActivate(key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCellActivate(key);
                  }
                }}
              >
                {!cellImages[key] && (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium opacity-70">
                    +
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* Bottom extension - 4 cells centered */}
        <div className="col-span-11">
          <div
            className="grid"
            style={{
              display: 'grid',
              gap: 'var(--gap)',
              gridAutoFlow: 'column',
              gridAutoColumns: 'var(--cell)',
              gridAutoRows: 'var(--row)',
              justifyContent: 'center',
            } as React.CSSProperties}
          >
            {Array.from({ length: 9 }, (_, colIndex) => {
              const key = cid('bottom-most-extension', -1, colIndex + 2);
              return (
                <div
                key={key}
                className="grid-cell active:animate-grid-pulse relative overflow-hidden cursor-pointer"
                style={{ ...(getCellStyle(key) as any) }}
                onMouseDown={(e) => startDrag(e, key)}
                onTouchStart={(e) => startDrag(e, key)}
                onClick={() => handleCellActivate(key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCellActivate(key);
                  }
                }}
              >
                {!cellImages[key] && (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium opacity-70">
                    +
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
        {/* No bottom extensions for 11x11 layout */}

      </div>
      
      

      <div className="hidden md:block mt-8 text-center max-w-md">
        <p className="text-sm text-gray-500">
          Click on any cell to upload an image. Images will be automatically clipped to fit each cell perfectly.
        </p>
      </div>
    </div>
  );
};

export default GridBoard;
