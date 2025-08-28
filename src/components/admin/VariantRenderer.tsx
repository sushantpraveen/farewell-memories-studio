
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { renderToCanvas, setCellImages } = useGrid();

  useEffect(() => {
    const generateVariantCanvas = async () => {
      try {
        console.log('Starting canvas generation for variant:', variant.id);
        
        // Convert admin members to collage members format
        const convertedMembers: Member[] = variant.members.map(member => ({
          id: member.id,
          name: member.name,
          photo: member.photo,
          vote: (member.vote || 'square') as Member['vote'],
          joinedAt: new Date(member.joinedAt),
          memberRollNumber: member.memberRollNumber
        }));

        // Set up cell images directly in the grid context
        const cellImages: Record<string, string> = {};
        convertedMembers.forEach((member, index) => {
          if (member.photo) {
            cellImages[`cell-${index}`] = member.photo;
          }
        });
        setCellImages(cellImages);

        // Wait a moment for images to be set
        await new Promise(resolve => setTimeout(resolve, 100));

        // Determine grid dimensions based on member count
        const memberCount = order.members.length;
        let cols = 0, rows = 0;
        
        // Calculate grid dimensions (this is a simplified version)
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

        // Render to canvas
        const canvas = await renderToCanvas({
          cols,
          rows,
          base: 100,
          desiredGapPx: 4,
          background: '#ffffff',
          draw: async ({ drawKey }) => {
            // Draw each cell
            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                const index = r * cols + c;
                if (index < convertedMembers.length) {
                  await drawKey(`cell-${index}`, r, c);
                }
              }
            }
          }
        });

        console.log('Canvas generated:', canvas.width, 'x', canvas.height);

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png');
        if (dataUrl && dataUrl !== 'data:,') {
          console.log('Successfully generated image for variant:', variant.id);
          onRendered(variant.id, dataUrl);
        } else {
          console.error('Canvas produced empty data URL for variant:', variant.id);
        }
      } catch (error) {
        console.error(`Error generating canvas for variant ${variant.id}:`, error);
      }
    };

    // Start generation after a short delay
    const timer = setTimeout(generateVariantCanvas, 200);
    return () => clearTimeout(timer);
  }, [variant, onRendered, renderToCanvas, setCellImages, order.members.length]);

  return (
    <canvas
      ref={canvasRef}
      className="hidden"
      width={500}
      height={500}
    />
  );
};

export const VariantRenderer: React.FC<VariantRendererProps> = ({
  order,
  variant,
  onRendered,
}) => {
  return (
    <div 
      id={`variant-${variant.id}`}
      className="absolute -top-[9999px] -left-[9999px] pointer-events-none"
      style={{ width: '500px', height: '500px' }}
    >
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
