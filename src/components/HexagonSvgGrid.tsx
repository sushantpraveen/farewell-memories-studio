import React, { useEffect, useState } from 'react';
import { Member } from '@/context/CollageContext';

type Slot = {
  id: string;
  d: string;
  transform?: string;
  isCenter: boolean;
  // Bounding box for positioning images within this hex cell
  bbox: { x: number; y: number; width: number; height: number };
};

const hexagonSvgModules = import.meta.glob<string>('./hexagon/*.svg', { as: 'raw' });

// Resolve path for glob lookup
function resolveSvgPath(path: string): string | null {
  if (path in hexagonSvgModules) return path;
  const key = Object.keys(hexagonSvgModules).find(
    (k) => k.endsWith(path) || k.includes(path)
  );
  return key ?? null;
}

interface HexagonSvgGridProps {
  memberCount: number;
  svgPath: string;
  previewMember?: Member | null;
  existingMembers?: Member[];
  centerEmptyDefault?: boolean;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

export const HexagonSvgGrid: React.FC<HexagonSvgGridProps> = ({
  memberCount,
  svgPath,
  previewMember,
  existingMembers = [],
  centerEmptyDefault = false,
  size = 'large',
}) => {
  const sizeStyles = {
    small: { maxH: 'min(65vh,450px)', minH: 220 },
    medium: { maxH: 'min(75vh,550px)', minH: 280 },
    large: { maxH: 'min(95vh,1100px)', minH: 480 },
    xlarge: { maxH: 'min(95vh,1100px)', minH: 480 },
  }[size];

  const [slots, setSlots] = useState<Slot[]>([]);
  const [viewBox, setViewBox] = useState({ width: 595.3, height: 936 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = resolveSvgPath(svgPath);
    if (!key) {
      setError('Template not found');
      setLoading(false);
      return;
    }

    const loader = hexagonSvgModules[key as keyof typeof hexagonSvgModules];
    if (typeof loader !== 'function') {
      setError('Failed to load');
      setLoading(false);
      return;
    }

    (loader as () => Promise<string>)()
      .then((text) => {
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        const vb = svg?.getAttribute('viewBox');
        if (vb) {
          const parts = vb.split(/\s+/).map(Number);
          if (parts.length >= 4) setViewBox({ width: parts[2], height: parts[3] });
        }

        const raw: Array<{
          id: string;
          d: string;
          transform?: string;
          pointCount: number;
          cx: number;
          cy: number;
          bbox: { x: number; y: number; width: number; height: number };
        }> = [];
        const vbParts = (svg?.getAttribute('viewBox') || '0 0 595.3 936').split(/\s+/).map(Number);
        const vw = vbParts[2] || 595.3;
        const vh = vbParts[3] || 936;

        // Parse polygons only (hexagon SVGs use polygon)
        const polygons = Array.from(doc.querySelectorAll('polygon'));
        polygons.forEach((poly) => {
          const points = poly.getAttribute('points');
          if (points) {
            const coords = points.trim().split(/[\s,]+/).map(Number);
            if (coords.length >= 6) {
              let sumX = 0, sumY = 0, n = 0;
              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
              for (let i = 0; i < coords.length; i += 2) {
                const x = coords[i];
                const y = coords[i + 1];
                sumX += x;
                sumY += y;
                n++;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
              }
              const cx = n > 0 ? sumX / n : 0;
              const cy = n > 0 ? sumY / n : 0;
              const bbox = {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY,
              };
              const parts: string[] = ['M', String(coords[0]), String(coords[1])];
              for (let i = 2; i < coords.length; i += 2) {
                parts.push('L', String(coords[i]), String(coords[i + 1]));
              }
              parts.push('Z');
              raw.push({
                id: `slot-${raw.length}`,
                d: parts.join(' '),
                transform: poly.getAttribute('transform') ?? undefined,
                pointCount: coords.length / 2,
                cx,
                cy,
                bbox,
              });
            }
          }
        });

        // Center = polygon with most points (the large central hexagon)
        const maxPoints = Math.max(...raw.map((r) => r.pointCount));
        const centerSlots = raw.filter((r) => r.pointCount === maxPoints && r.pointCount > 15);
        const borderSlots = raw.filter((r) => !(r.pointCount === maxPoints && r.pointCount > 15));

        // Sort border slots clockwise: top (1-3) → right (4-8) → bottom (9-11) → left (12-14)
        const centerX = vw / 2;
        const centerY = vh / 2;
        const sortedBorder = [...borderSlots].sort((a, b) => {
          const angleA = Math.atan2(a.cy - centerY, a.cx - centerX);
          const angleB = Math.atan2(b.cy - centerY, b.cx - centerX);
          const normA = ((angleA + Math.PI / 2) + Math.PI * 2) % (Math.PI * 2);
          const normB = ((angleB + Math.PI / 2) + Math.PI * 2) % (Math.PI * 2);
          return normA - normB;
        });

        const ordered: Slot[] = [
          ...centerSlots.map((s) => ({ id: s.id, d: s.d, transform: s.transform, isCenter: true, bbox: s.bbox })),
          ...sortedBorder.map((s) => ({ id: s.id, d: s.d, transform: s.transform, isCenter: false, bbox: s.bbox })),
        ];

        setSlots(ordered);
        setError(null);
      })
      .catch((err) => {
        setError('Failed to load');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [svgPath]);

  const { width, height } = viewBox;

  // Strict one-to-one mapping: Cell 0 (center) = member 0, Cell 1 = member 1, Cell 2 = member 2, etc.
  // With previewMember (JoinGroup): center = preview, border slots = existingMembers[0], [1], ...
  // Without previewMember (Editor): all slots = existingMembers[0], [1], ...
  const getPhotoForSlot = (slotIndex: number): string | undefined => {
    if (slotIndex === 0) {
      if (previewMember?.photo) return previewMember.photo;
      if (!centerEmptyDefault && existingMembers[0]?.photo) return existingMembers[0].photo;
      return undefined;
    }
    const memberIndex = previewMember ? slotIndex - 1 : slotIndex;
    return existingMembers[memberIndex]?.photo;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full aspect-[595/936] bg-muted/30 rounded-xl" style={{ maxHeight: sizeStyles.maxH, minHeight: sizeStyles.minH }}>
        <p className="text-sm text-muted-foreground">Loading hexagon template...</p>
      </div>
    );
  }

  if (error || slots.length === 0) {
    return (
      <div className="flex items-center justify-center w-full aspect-[595/936] bg-muted/30 rounded-xl" style={{ maxHeight: sizeStyles.maxH, minHeight: sizeStyles.minH }}>
        <p className="text-sm text-destructive">{error || 'No slots found'}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-full rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center" style={{ minHeight: sizeStyles.minH, maxHeight: sizeStyles.maxH }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-w-full" preserveAspectRatio="xMidYMid meet" style={{ minHeight: sizeStyles.minH }}>
        <defs>
          {slots.map((s, i) => (
            <clipPath key={s.id} id={`hex-clip-${s.id}`} clipPathUnits="userSpaceOnUse">
              <path d={s.d} transform={s.transform} />
            </clipPath>
          ))}
        </defs>
        <rect width="100%" height="100%" fill="#fafafa" />
        {slots.map((s, slotIndex) => {
          const photo = getPhotoForSlot(slotIndex);
          // Use bounding box to position image within this specific hex cell
          const { x: bx, y: by, width: bw, height: bh } = s.bbox;
          // Make image square based on the larger dimension for proper face cropping
          const imgSize = Math.max(bw, bh);
          const imgX = bx + (bw - imgSize) / 2;
          const imgY = by + (bh - imgSize) / 2;
          return (
            <g key={s.id}>
              <path
                d={s.d}
                transform={s.transform}
                fill="#00c1f3"
                fillRule="evenodd"
                stroke="#231f20"
                strokeMiterlimit={10}
              />
              {photo && (
                <image
                  href={photo}
                  x={imgX}
                  y={imgY}
                  width={imgSize}
                  height={imgSize}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#hex-clip-${s.id})`}
                  style={{ pointerEvents: 'none' }}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default HexagonSvgGrid;
