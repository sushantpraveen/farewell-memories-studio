
import React, { useRef, useEffect } from 'react';
import { Order } from '@/types/admin';
import { GridVariant } from '@/utils/gridVariantGenerator';

interface VariantRendererProps {
  order: Order;
  variant: GridVariant;
  onRendered: (variantId: string, dataUrl: string) => void;
}

export const VariantRenderer: React.FC<VariantRendererProps> = ({
  order,
  variant,
  onRendered,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateVariantImage = async () => {
      try {
        console.log('Rendering variant:', variant.id, 'with center member:', variant.centerMember.name);
        
        const memberCount = order.members.length;
        
        // Calculate grid dimensions - use the same logic as the original components
        let cols = 0, rows = 0;
        
        if (memberCount <= 4) {
          cols = rows = 2;
        } else if (memberCount <= 9) {
          cols = rows = 3;
        } else if (memberCount <= 16) {
          cols = rows = 4;
        } else if (memberCount <= 25) {
          cols = rows = 5;
        } else if (memberCount <= 36) {
          cols = rows = 6;
        } else {
          cols = rows = Math.ceil(Math.sqrt(memberCount));
        }

        console.log('Grid layout:', cols, 'x', rows, 'for', memberCount, 'members');

        // Create canvas
        const canvas = document.createElement('canvas');
        const size = 400;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Canvas context not available');
        }

        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        // Calculate cell dimensions
        const cellSize = size / Math.max(cols, rows);
        const gap = 2;
        const actualCellSize = cellSize - gap;

        // Helper function to load and draw image
        const loadAndDrawImage = async (src: string, x: number, y: number, width: number, height: number) => {
          return new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              try {
                // Draw image with cover behavior
                const imgRatio = img.width / img.height;
                const cellRatio = width / height;
                
                let drawWidth = width;
                let drawHeight = height;
                let offsetX = 0;
                let offsetY = 0;
                
                if (imgRatio > cellRatio) {
                  // Image is wider - fit height and center horizontally
                  drawWidth = height * imgRatio;
                  offsetX = (width - drawWidth) / 2;
                } else {
                  // Image is taller - fit width and center vertically
                  drawHeight = width / imgRatio;
                  offsetY = (height - drawHeight) / 2;
                }
                
                ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
                resolve();
              } catch (err) {
                reject(err);
              }
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = src;
          });
        };

        // Draw grid cells
        let cellIndex = 0;
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            if (cellIndex >= variant.members.length) break;
            
            const member = variant.members[cellIndex];
            if (member && member.photo) {
              const x = col * cellSize + gap / 2;
              const y = row * cellSize + gap / 2;
              
              try {
                await loadAndDrawImage(member.photo, x, y, actualCellSize, actualCellSize);
              } catch (error) {
                console.warn('Failed to load image for member:', member.name, error);
                // Draw placeholder
                ctx.fillStyle = '#f3f4f6';
                ctx.fillRect(x, y, actualCellSize, actualCellSize);
                ctx.fillStyle = '#6b7280';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(member.name.split(' ')[0], x + actualCellSize / 2, y + actualCellSize / 2);
              }
            } else {
              // Draw empty cell
              const x = col * cellSize + gap / 2;
              const y = row * cellSize + gap / 2;
              ctx.fillStyle = '#f9fafb';
              ctx.fillRect(x, y, actualCellSize, actualCellSize);
            }
            
            cellIndex++;
          }
          if (cellIndex >= variant.members.length) break;
        }

        // Get the data URL
        const dataUrl = canvas.toDataURL('image/png', 0.9);
        
        console.log('Successfully generated variant image for:', variant.id);
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
