
import React, { useRef, useEffect } from 'react';
import { GridProvider } from '@/components/square/context/GridContext';
import { Order } from '@/types/admin';
import { GridVariant } from '@/utils/gridVariantGenerator';
import { Member } from '@/context/CollageContext';
import { useGrid } from '@/components/square/context/GridContext';

interface VariantRendererProps {
  order: Order;
  variant: GridVariant;
  onRendered: (variantId: string, dataUrl: string) => void;
}

// Inner component that has access to GridContext
const VariantCanvas: React.FC<{
  order: Order;
  variant: GridVariant;
  onRendered: (variantId: string, dataUrl: string) => void;
}> = ({ order, variant, onRendered }) => {
  const { renderToCanvas, setCellImages } = useGrid();

  useEffect(() => {
    const generateVariantCanvas = async () => {
      try {
        console.log('Starting canvas generation for variant:', variant.id);
        console.log('Variant members:', variant.members.map(m => ({ name: m.name, hasPhoto: !!m.photo })));
        
        // Calculate grid dimensions based on member count
        const memberCount = order.members.length;
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

        console.log('Grid dimensions:', cols, 'x', rows, 'for', memberCount, 'members');

        // Set up cell images with proper mapping
        const cellImages: Record<string, string> = {};
        
        // Map variant members (which are arranged with center member in correct position) to cell positions
        for (let i = 0; i < Math.min(variant.members.length, cols * rows); i++) {
          const member = variant.members[i];
          if (member?.photo) {
            cellImages[`cell-${i}`] = member.photo;
            console.log(`Mapped cell-${i} to member:`, member.name);
          }
        }

        console.log('Cell images mapped:', Object.keys(cellImages).length, 'cells');
        setCellImages(cellImages);

        // Wait for images to be set in context
        await new Promise(resolve => setTimeout(resolve, 200));

        // Render to canvas with proper grid layout
        const canvas = await renderToCanvas({
          cols,
          rows,
          base: 120, // Larger base size for better quality
          desiredGapPx: 4,
          background: '#ffffff',
          draw: async ({ drawKey }) => {
            console.log('Drawing grid cells...');
            let drawnCells = 0;
            
            // Draw each cell in row-major order
            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                const index = r * cols + c;
                const cellKey = `cell-${index}`;
                
                if (cellImages[cellKey]) {
                  await drawKey(cellKey, r, c);
                  drawnCells++;
                  console.log(`Drew cell at row ${r}, col ${c} (index ${index})`);
                }
              }
            }
            
            console.log(`Total cells drawn: ${drawnCells}`);
          }
        });

        console.log('Canvas generated:', canvas.width, 'x', canvas.height);

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png', 0.9);
        if (dataUrl && dataUrl !== 'data:,' && dataUrl.length > 100) {
          console.log('Successfully generated image for variant:', variant.id, 'Size:', dataUrl.length);
          onRendered(variant.id, dataUrl);
        } else {
          console.error('Canvas produced invalid data URL for variant:', variant.id);
          throw new Error('Invalid canvas output');
        }
      } catch (error) {
        console.error(`Error generating canvas for variant ${variant.id}:`, error);
        // Still call onRendered to advance progress, but with empty data
        onRendered(variant.id, '');
      }
    };

    // Start generation with a delay to ensure component is mounted
    const timer = setTimeout(generateVariantCanvas, 300);
    return () => clearTimeout(timer);
  }, [variant, onRendered, renderToCanvas, setCellImages, order.members.length]);

  return null; // No visual component needed
};

export const VariantRenderer: React.FC<VariantRendererProps> = ({
  order,
  variant,
  onRendered,
}) => {
  return (
    <div className="hidden">
      <GridProvider>
        <VariantCanvas
          order={order}
          variant={variant}
          onRendered={onRendered}
        />
      </GridProvider>
    </div>
  );
};
