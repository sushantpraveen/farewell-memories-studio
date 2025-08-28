
import React, { useRef, useEffect } from 'react';
import { Order } from '@/types/admin';
import { GridVariant } from '@/utils/gridVariantGenerator';
import * as faceapi from 'face-api.js';
import { enumerate45 } from '@/templates/layouts';

interface VariantRendererProps {
  order: Order;
  variant: GridVariant;
  onRendered: (variantId: string, dataUrl: string) => void;
  templateKey?: string; // e.g., '45' (future: support others via registry)
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

        // Create canvas at print-equivalent pixels: 8in x 12.5in @ 300 DPI => 2400 x 3750
        const canvas = document.createElement('canvas');
        const DPI = 300;
        const TARGET_W_IN = 8;
        const TARGET_H_IN = 12.5;
        const COLS = 8;
        const ROWS = 11; // includes top-ext-most and bottom-most rows
        const gap = 4; // align with desiredGapPx used in 45.tsx download
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

        // Match 45.tsx structure: 8 columns, 11 virtual rows
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
        if (templateKey === '45') {
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
        } else {
          // Fallback: do nothing for unknown template (future templates will be added here)
        }

        // Export
        const dataUrl = canvas.toDataURL('image/png', 0.9);
        onRendered(variant.id, dataUrl);

      } catch (error) {
        console.error('Error generating variant image:', error);
        onRendered(variant.id, '');
      }
    };

    // Start generation with a delay to ensure component is ready
    const timer = setTimeout(generateVariantImage, 100);
    return () => clearTimeout(timer);
  }, [variant, onRendered, order]);

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
    const PADDING = 0.35; // expand to include a bit of hair/shoulders

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
