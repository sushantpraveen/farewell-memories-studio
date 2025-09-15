// import React, { useRef, useEffect } from 'react';
// import { Order } from '@/types/admin';
// import { GridVariant } from '@/utils/gridVariantGenerator';
// import { enumerate45, enumerate33, enumerate34 } from '@/templates/layouts';

// interface VariantRendererProps {
//   order: Order;
//   variant: GridVariant;
//   onRendered: (variantId: string, dataUrl: string) => void;
//   templateKey?: string; // e.g., '45' (future: support others via registry)
// }

// // -------- PNG DPI embedding (pHYs chunk @ 300 DPI) --------
// function embedPngDpi300(dataUrl: string): string {
//   try {
//     const u8 = dataURLToUint8(dataUrl);
//     const withPhys = insertPhysChunk(u8, 300);
//     return uint8ToDataURL(withPhys);
//   } catch {
//     // Fallback to original if anything fails
//     return dataUrl;
//   }
// }

// function dataURLToUint8(dataUrl: string): Uint8Array {
//   const base64 = dataUrl.split(',')[1] || '';
//   const binary = typeof atob !== 'undefined' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
//   const len = binary.length;
//   const bytes = new Uint8Array(len);
//   for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
//   return bytes;
// }

// function uint8ToDataURL(bytes: Uint8Array): string {
//   const binary = Array.from(bytes).map((b) => String.fromCharCode(b)).join('');
//   const base64 = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
//   return `data:image/png;base64,${base64}`;
// }

// function insertPhysChunk(pngBytes: Uint8Array, dpi: number): Uint8Array {
//   const PPM = Math.round(dpi / 0.0254); // pixels per meter (300dpi ≈ 11811)
//   const signature = pngBytes.slice(0, 8);
//   const PNG_SIG = new Uint8Array([137,80,78,71,13,10,26,10]);
//   for (let i = 0; i < 8; i++) if (signature[i] !== PNG_SIG[i]) return pngBytes; // not a PNG

//   // Walk chunks and insert pHYs right after IHDR
//   let pos = 8;
//   const out: number[] = [];
//   // push signature
//   for (let i = 0; i < 8; i++) out.push(PNG_SIG[i]);

//   let inserted = false;
//   while (pos < pngBytes.length) {
//     const length = readUint32(pngBytes, pos); // big-endian
//     const type = String.fromCharCode(
//       pngBytes[pos + 4],
//       pngBytes[pos + 5],
//       pngBytes[pos + 6],
//       pngBytes[pos + 7]
//     );
//     const dataStart = pos + 8;
//     const dataEnd = dataStart + length;
//     const crcEnd = dataEnd + 4;

//     // copy current chunk
//     for (let i = pos; i < crcEnd; i++) out.push(pngBytes[i]);

//     pos = crcEnd;

//     if (!inserted && type === 'IHDR') {
//       // Build pHYs chunk
//       const physData = new Uint8Array(9);
//       writeUint32(physData, 0, PPM);
//       writeUint32(physData, 4, PPM);
//       physData[8] = 1; // unit: meter

//       const typeBytes = new Uint8Array([112, 72, 89, 115]); // 'pHYs'
//       const lengthBytes = uint32ToBytes(physData.length);
//       const crc = crc32Concat(typeBytes, physData);
//       const crcBytes = uint32ToBytes(crc);

//       // Append pHYs to output
//       for (let b of lengthBytes) out.push(b);
//       for (let b of typeBytes) out.push(b);
//       for (let b of physData) out.push(b);
//       for (let b of crcBytes) out.push(b);
//       inserted = true;
//     }
//   }

//   return new Uint8Array(out);
// }

// function readUint32(arr: Uint8Array, pos: number): number {
//   return (arr[pos] << 24) | (arr[pos + 1] << 16) | (arr[pos + 2] << 8) | arr[pos + 3];
// }

// function writeUint32(arr: Uint8Array, pos: number, val: number) {
//   arr[pos] = (val >>> 24) & 0xff;
//   arr[pos + 1] = (val >>> 16) & 0xff;
//   arr[pos + 2] = (val >>> 8) & 0xff;
//   arr[pos + 3] = val & 0xff;
// }

// function uint32ToBytes(val: number): Uint8Array {
//   const b = new Uint8Array(4);
//   writeUint32(b, 0, val >>> 0);
//   return b;
// }

// // CRC32 over type+data
// function crc32Concat(type: Uint8Array, data: Uint8Array): number {
//   const table = crc32Table();
//   let crc = 0xffffffff;
//   for (let i = 0; i < type.length; i++) crc = (crc >>> 8) ^ table[(crc ^ type[i]) & 0xff];
//   for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
//   return (crc ^ 0xffffffff) >>> 0;
// }

// let _crcTable: Uint32Array | null = null;
// function crc32Table(): Uint32Array {
//   if (_crcTable) return _crcTable;
//   const table = new Uint32Array(256);
//   for (let n = 0; n < 256; n++) {
//     let c = n;
//     for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
//     table[n] = c >>> 0;
//   }
//   _crcTable = table;
//   return table;
// }

// export const VariantRenderer: React.FC<VariantRendererProps> = ({
//   order,
//   variant,
//   onRendered,
//   templateKey = '45',
// }) => {
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   useEffect(() => {
//     const generateVariantImage = async () => {
//       try {
//         console.log('Rendering variant:', variant.id, 'with center member:', variant.centerMember.name);

//         // Create canvas at print-equivalent pixels based on template
//         const canvas = document.createElement('canvas');
//         const DPI = 300;
//         // Derive effective template key from the order to match layouts.ts
//         const count = order.members.length;
//         let effectiveKey = templateKey;
//         if (order.gridTemplate === 'square') {
//           if (count === 33) effectiveKey = '33';
//           else if (count === 45) effectiveKey = '45';
//         }
//         const is45 = effectiveKey === '45';
//         const TARGET_W_IN = is45 ? 8 : 8.5;
//         const TARGET_H_IN = 13.5;
//         const COLS = 8;
//         const ROWS = is45 ? 10 : 9; // 45 → 10 rows; 33 → 9 rows (0..8)
//         const gap = 4; // align with desiredGapPx used in downloads
//         canvas.width = Math.round(TARGET_W_IN * DPI);
//         canvas.height = Math.round(TARGET_H_IN * DPI);
//         const ctx = canvas.getContext('2d');
//         if (!ctx) throw new Error('Canvas context not available');
//         // Improve resampling quality for clearer faces
//         (ctx as any).imageSmoothingEnabled = true;
//         (ctx as any).imageSmoothingQuality = 'high';

//         // Background
//         ctx.fillStyle = '#ffffff';
//         ctx.fillRect(0, 0, canvas.width, canvas.height);

//         // Match template structure
//         // Compute cell sizes to fully occupy the fixed canvas with gaps
//         const cellW = (canvas.width - (COLS + 1) * gap) / COLS;
//         const cellH = (canvas.height - (ROWS + 1) * gap) / ROWS;

//         const rect = (c: number, r: number, cspan = 1, rspan = 1) => ({
//           x: gap + c * (cellW + gap),
//           y: gap + r * (cellH + gap),
//           w: cspan * cellW + (cspan - 1) * gap,
//           h: rspan * cellH + (rspan - 1) * gap,
//         });

//         // Cloudinary helpers
//         const isCloudinaryUrl = (url: string): boolean => typeof url === 'string' && url.includes('/image/upload');
//         const withCloudinaryTransform = (url: string, transform: string): string => {
//           try { return url.replace('/image/upload/', `/image/upload/${transform}/`); } catch { return url; }
//         };

//         const drawCover = async (src: string, c: number, r: number, cspan = 1, rspan = 1) => {
//           const { x, y, w, h } = rect(c, r, cspan, rspan);
//           // Try to apply Cloudinary face-aware transform at the source when possible
//           let source = src;
//           if (isCloudinaryUrl(src)) {
//             const sizeW = Math.round(w);
//             const sizeH = Math.round(h);
//             const aspect = `${sizeW}:${sizeH}`; // e.g. "2:3", "4:5" etc.
//             const transform = `c_thumb,g_auto:face,z_0.8,ar_${aspect},w_${sizeW},h_${sizeH},q_auto,f_auto,dpr_auto`;
//             source = withCloudinaryTransform(src, transform);
//           }
//           return new Promise<void>((resolve, reject) => {
//             const img = new Image();
//             img.crossOrigin = 'anonymous';
//             img.onload = () => {
//               // Default to CSS-like cover cropping (no face detection)
//               const sRatio = img.width / img.height;
//               const dRatio = w / h;
//               let sx = 0, sy = 0, sw = img.width, sh = img.height;
//               if (sRatio > dRatio) {
//                 sh = img.height;
//                 sw = sh * dRatio;
//                 sx = (img.width - sw) / 2;
//               } else {
//                 sw = img.width;
//                 sh = sw / dRatio;
//                 sy = (img.height - sh) / 2;
//               }
//               ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
//               resolve();
//             };
//             img.onerror = () => reject(new Error('Failed to load image'));
//             img.src = source;
//           });
//         };

//         // Helper: safe getter that ignores center index when needed
//         const memberAt = (idx: number) => variant.members[idx];

//         // Draw using shared enumerator for the selected template
//         if (effectiveKey === '45') {
//           await enumerate45(async (slot) => {
//             if (slot.kind === 'center') {
//               if (variant.centerMember?.photo) {
//                 await drawCover(variant.centerMember.photo, slot.c, slot.r, slot.cspan ?? 1, slot.rspan ?? 1);
//               } else {
//                 const { x, y, w, h } = rect(slot.c, slot.r, slot.cspan ?? 1, slot.rspan ?? 1);
//                 ctx.fillStyle = '#f3f4f6';
//                 ctx.fillRect(x, y, w, h);
//               }
//               return;
//             }
//             const m = slot.index >= 0 ? memberAt(slot.index) : null;
//             if (m?.photo) {
//               await drawCover(m.photo, slot.c, slot.r, slot.cspan ?? 1, slot.rspan ?? 1);
//             }
//           });
//         } else if (effectiveKey === '33') {
//           await enumerate33(async (slot) => {
//             if (slot.kind === 'center') {
//               if (variant.centerMember?.photo) {
//                 await drawCover(variant.centerMember.photo, slot.c, slot.r, slot.cspan ?? 1, slot.rspan ?? 1);
//               } else {
//                 const { x, y, w, h } = rect(slot.c, slot.r, slot.cspan ?? 1, slot.rspan ?? 1);
//                 ctx.fillStyle = '#f3f4f6';
//                 ctx.fillRect(x, y, w, h);
//               }
//               return;
//             }
//             const m = slot.index >= 0 ? memberAt(slot.index) : null;
//             if (m?.photo) {
//               await drawCover(m.photo, slot.c, slot.r, slot.cspan ?? 1, slot.rspan ?? 1);
//             }
//           });
//         } else if (effectiveKey === '34') {
//         await enumerate34(async (slot) => {
//           if (slot.kind === 'center') {
//             if (variant.centerMember?.photo) {
//               await drawCover(variant.centerMember.photo, slot.c, slot.r, slot.cspan ?? 1, slot.rspan ?? 1);
//             } else {
//               const { x, y, w, h } = rect(slot.c, slot.r, slot.cspan ?? 1, slot.rspan ?? 1);
//               ctx.fillStyle = '#f3f4f6';
//               ctx.fillRect(x, y, w, h);
//             }
//             return;
//           }
//           const m = slot.index >= 0 ? memberAt(slot.index) : null;
//           if (m?.photo) {
//             await drawCover(m.photo, slot.c, slot.r, slot.cspan ?? 1, slot.rspan ?? 1);
//           }
//         });
//       }

//         else {
//           // Fallback: do nothing for unknown template (future templates will be added here)
//         }

//         // Export with embedded 300 DPI (pHYs chunk)
//         const rawPng = canvas.toDataURL('image/png');
//         const dpiPng = embedPngDpi300(rawPng);
//         onRendered(variant.id, dpiPng);

//       } catch (error) {
//         console.error('Error generating variant image:', error);
//         onRendered(variant.id, '');
//       }
//     };

//     // Start generation with a delay to ensure component is ready
//     const timer = setTimeout(generateVariantImage, 100);
//     return () => clearTimeout(timer);
//   }, [variant, onRendered, order, templateKey]);

//   // Hidden canvas for any additional processing if needed
//   return (
//     <div className="hidden">
//       <canvas ref={canvasRef} />
//     </div>
//   );
// };


import React, { useRef, useEffect } from 'react';
import { Order } from '@/types/admin';
import { GridVariant } from '@/utils/gridVariantGenerator';
import * as faceapi from 'face-api.js';
import { enumerate45, enumerate33, enumerate34 } from '@/templates/layouts';

interface VariantRendererProps {
  order: Order;
  variant: GridVariant;
  onRendered: (variantId: string, dataUrl: string) => void;
  templateKey?: string; // e.g., '45' (future: support others via registry)
}

// -------- PNG DPI embedding (pHYs chunk @ 300 DPI) --------
function embedPngDpi300(dataUrl: string): string {
  try {
    const u8 = dataURLToUint8(dataUrl);
    const withPhys = insertPhysChunk(u8, 300);
    return uint8ToDataURL(withPhys);
  } catch {
    // Fallback to original if anything fails
    return dataUrl;
  }
}

function dataURLToUint8(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = typeof atob !== 'undefined' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ToDataURL(bytes: Uint8Array): string {
  const binary = Array.from(bytes).map((b) => String.fromCharCode(b)).join('');
  const base64 = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
  return `data:image/png;base64,${base64}`;
}

function insertPhysChunk(pngBytes: Uint8Array, dpi: number): Uint8Array {
  const PPM = Math.round(dpi / 0.0254); // pixels per meter (300dpi ≈ 11811)
  const signature = pngBytes.slice(0, 8);
  const PNG_SIG = new Uint8Array([137,80,78,71,13,10,26,10]);
  for (let i = 0; i < 8; i++) if (signature[i] !== PNG_SIG[i]) return pngBytes; // not a PNG

  // Walk chunks and insert pHYs right after IHDR
  let pos = 8;
  const out: number[] = [];
  // push signature
  for (let i = 0; i < 8; i++) out.push(PNG_SIG[i]);

  let inserted = false;
  while (pos < pngBytes.length) {
    const length = readUint32(pngBytes, pos); // big-endian
    const type = String.fromCharCode(
      pngBytes[pos + 4],
      pngBytes[pos + 5],
      pngBytes[pos + 6],
      pngBytes[pos + 7]
    );
    const dataStart = pos + 8;
    const dataEnd = dataStart + length;
    const crcEnd = dataEnd + 4;

    // copy current chunk
    for (let i = pos; i < crcEnd; i++) out.push(pngBytes[i]);

    pos = crcEnd;

    if (!inserted && type === 'IHDR') {
      // Build pHYs chunk
      const physData = new Uint8Array(9);
      writeUint32(physData, 0, PPM);
      writeUint32(physData, 4, PPM);
      physData[8] = 1; // unit: meter

      const typeBytes = new Uint8Array([112, 72, 89, 115]); // 'pHYs'
      const lengthBytes = uint32ToBytes(physData.length);
      const crc = crc32Concat(typeBytes, physData);
      const crcBytes = uint32ToBytes(crc);

      // Append pHYs to output
      for (let b of lengthBytes) out.push(b);
      for (let b of typeBytes) out.push(b);
      for (let b of physData) out.push(b);
      for (let b of crcBytes) out.push(b);
      inserted = true;
    }
  }

  return new Uint8Array(out);
}

function readUint32(arr: Uint8Array, pos: number): number {
  return (arr[pos] << 24) | (arr[pos + 1] << 16) | (arr[pos + 2] << 8) | arr[pos + 3];
}

function writeUint32(arr: Uint8Array, pos: number, val: number) {
  arr[pos] = (val >>> 24) & 0xff;
  arr[pos + 1] = (val >>> 16) & 0xff;
  arr[pos + 2] = (val >>> 8) & 0xff;
  arr[pos + 3] = val & 0xff;
}

function uint32ToBytes(val: number): Uint8Array {
  const b = new Uint8Array(4);
  writeUint32(b, 0, val >>> 0);
  return b;
}

// CRC32 over type+data
function crc32Concat(type: Uint8Array, data: Uint8Array): number {
  const table = crc32Table();
  let crc = 0xffffffff;
  for (let i = 0; i < type.length; i++) crc = (crc >>> 8) ^ table[(crc ^ type[i]) & 0xff];
  for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

let _crcTable: Uint32Array | null = null;
function crc32Table(): Uint32Array {
  if (_crcTable) return _crcTable;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  _crcTable = table;
  return table;
}

export const VariantRenderer: React.FC<VariantRendererProps> = ({
  order,
  variant,
  onRendered,
  templateKey = '45',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateVariantImage = async () => {
      try {
        console.log('Rendering variant:', variant.id, 'with center member:', variant.centerMember.name);

        // 0) Ensure face-api models are loaded (once per session)
        await ensureModelsLoaded();

        // Create canvas at print-equivalent pixels based on template
        const canvas = document.createElement('canvas');
        const DPI = 300;
        // Derive effective template key from the order to match layouts.ts
        const count = order.members.length;
        let effectiveKey = templateKey;
        if (order.gridTemplate === 'square') {
          if (count === 33) effectiveKey = '33';
          else if (count === 45) effectiveKey = '45';
        }
        const is45 = effectiveKey === '45';
        const TARGET_W_IN = is45 ? 8 : 8.5;
        const TARGET_H_IN = 13.5;
        const COLS = 8;
        const ROWS = is45 ? 10 : 9; // 45 → 10 rows; 33 → 9 rows (0..8)
        const gap = 4; // align with desiredGapPx used in downloads
        canvas.width = Math.round(TARGET_W_IN * DPI);
        canvas.height = Math.round(TARGET_H_IN * DPI);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');
        // Improve resampling quality for clearer faces
        (ctx as any).imageSmoothingEnabled = true;
        (ctx as any).imageSmoothingQuality = 'high';

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Match template structure
        // Compute cell sizes to fully occupy the fixed canvas with gaps
        const cellW = (canvas.width - (COLS + 1) * gap) / COLS;
        const cellH = (canvas.height - (ROWS + 1) * gap) / ROWS;

        const rect = (c: number, r: number, cspan = 1, rspan = 1) => ({
          x: gap + c * (cellW + gap),
          y: gap + r * (cellH + gap),
          w: cspan * cellW + (cspan - 1) * gap,
          h: rspan * cellH + (rspan - 1) * gap,
        });

        const drawCover = async (src: string, c: number, r: number, cspan = 1, rspan = 1) => {
          const { x, y, w, h } = rect(c, r, cspan, rspan);
          return new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = async () => {
              try {
                // Try face-aware crop first (await detection)
                const { sx, sy, sw, sh } = await getFaceAwareCropAsync(img, w, h);
                ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
                resolve();
              } catch (e) {
                reject(e);
              }
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = src;
          });
        };

        // Helper: safe getter that ignores center index when needed
        const memberAt = (idx: number) => variant.members[idx];

        // Draw using shared enumerator for the selected template
        if (effectiveKey === '45') {
          await enumerate45(async (slot) => {
            if (slot.kind === 'center') {
              if (variant.centerMember?.photo) {
                await drawCover(variant.centerMember.photo, slot.c, slot.r, slot.cspan ?? 1, slot.rspan ?? 1);
              } else {
                const { x, y, w, h } = rect(slot.c, slot.r, slot.cspan ?? 1, slot.rspan ?? 1);
                ctx.fillStyle = '#f3f4f6';
                ctx.fillRect(x, y, w, h);
              }
              return;
            }
            const m = slot.index >= 0 ? memberAt(slot.index) : null;
            if (m?.photo) {
              await drawCover(m.photo, slot.c, slot.r, slot.cspan ?? 1, slot.rspan ?? 1);
            }
          });
        } else if (effectiveKey === '33') {
          await enumerate33(async (slot) => {
            if (slot.kind === 'center') {
              if (variant.centerMember?.photo) {
                await drawCover(variant.centerMember.photo, slot.c, slot.r, slot.cspan ?? 1, slot.rspan ?? 1);
              } else {
                const { x, y, w, h } = rect(slot.c, slot.r, slot.cspan ?? 1, slot.rspan ?? 1);
                ctx.fillStyle = '#f3f4f6';
                ctx.fillRect(x, y, w, h);
              }
              return;
            }
            const m = slot.index >= 0 ? memberAt(slot.index) : null;
            if (m?.photo) {
              await drawCover(m.photo, slot.c, slot.r, slot.cspan ?? 1, slot.rspan ?? 1);
            }
          });
        } else if (effectiveKey === '34') {
        await enumerate34(async (slot) => {
          if (slot.kind === 'center') {
            if (variant.centerMember?.photo) {
              await drawCover(variant.centerMember.photo, slot.c, slot.r, slot.cspan ?? 1, slot.rspan ?? 1);
            } else {
              const { x, y, w, h } = rect(slot.c, slot.r, slot.cspan ?? 1, slot.rspan ?? 1);
              ctx.fillStyle = '#f3f4f6';
              ctx.fillRect(x, y, w, h);
            }
            return;
          }
          const m = slot.index >= 0 ? memberAt(slot.index) : null;
          if (m?.photo) {
            await drawCover(m.photo, slot.c, slot.r, slot.cspan ?? 1, slot.rspan ?? 1);
          }
        });
      } 

        else {
          // Fallback: do nothing for unknown template (future templates will be added here)
        }

        // Export with embedded 300 DPI (pHYs chunk)
        const rawPng = canvas.toDataURL('image/png');
        const dpiPng = embedPngDpi300(rawPng);
        onRendered(variant.id, dpiPng);

      } catch (error) {
        console.error('Error generating variant image:', error);
        onRendered(variant.id, '');
      }
    };

    // Start generation with a delay to ensure component is ready
    const timer = setTimeout(generateVariantImage, 100);
    return () => clearTimeout(timer);
  }, [variant, onRendered, order, templateKey]);

  // Hidden canvas for any additional processing if needed
  return (
    <div className="hidden">
      <canvas ref={canvasRef} />
    </div>
  );
};

// -------- face-api helpers --------
let faceModelsLoaded = false;
async function ensureModelsLoaded() {
  if (faceModelsLoaded) return;
  const MODEL_URL = '/weights';
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
  ]);
  faceModelsLoaded = true;
}

async function getFaceAwareCropAsync(img: HTMLImageElement, targetW: number, targetH: number) {
  const dRatio = targetW / targetH;

  const coverFallback = () => {
    const sRatio = img.width / img.height;
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
    return { sx, sy, sw, sh };
  };

  try {
    const det = await faceapi
      .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks();
    if (!det) return coverFallback();

    const box = det.detection.box; // { x, y, width, height }
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const PADDING = 0.50; // expand to include a bit of hair/shoulders

    // size so that face box fits inside target aspect with padding
    let sw = box.width * (1 + PADDING);
    let sh = sw / dRatio;
    const neededH = box.height * (1 + PADDING);
    if (sh < neededH) {
      sh = neededH;
      sw = sh * dRatio;
    }

    // center on face
    let sx = cx - sw / 2;
    let sy = cy - sh / 2;

    // clamp to image bounds
    if (sx < 0) sx = 0;
    if (sy < 0) sy = 0;
    if (sx + sw > img.width) sx = Math.max(0, img.width - sw);
    if (sy + sh > img.height) sy = Math.max(0, img.height - sh);

    // final safety: ensure sw/sh within bounds
    sw = Math.min(sw, img.width);
    sh = Math.min(sh, img.height);

    return { sx, sy, sw, sh };
  } catch {
    return coverFallback();
  }
}
