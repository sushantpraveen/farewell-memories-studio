
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateVariantImage = async () => {
      try {
        console.log('Rendering variant:', variant.id, 'with center member:', variant.centerMember.name);
        
        // Import the appropriate grid component dynamically
        let GridComponent;
        const memberCount = order.members.length;
        
        if (order.gridTemplate === 'square') {
          // Use the specific square grid component based on member count
          const gridModule = await import(`@/components/square/${memberCount}.tsx`);
          GridComponent = gridModule.default;
        } else {
          // Fallback for other templates
          const { SquareGrid } = await import('@/components/grids/SquareGrid');
          GridComponent = SquareGrid;
        }

        if (!GridComponent) {
          console.error('No grid component found for', memberCount, 'members');
          onRendered(variant.id, '');
          return;
        }

        // Create a temporary container for rendering
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.top = '-10000px';
        tempContainer.style.left = '-10000px';
        tempContainer.style.width = '400px';
        tempContainer.style.height = '400px';
        document.body.appendChild(tempContainer);

        // Create React root and render the grid
        const { createRoot } = await import('react-dom/client');
        const root = createRoot(tempContainer);

        // Prepare members with the variant arrangement
        const variantMembers = variant.members.map(member => ({
          ...member,
          photo: member.photo || ''
        }));

        // Render the grid component
        await new Promise<void>((resolve) => {
          root.render(
            React.createElement(GridComponent, {
              members: variantMembers,
              onImageLoad: () => {
                // Wait a bit for all images to load
                setTimeout(() => {
                  resolve();
                }, 500);
              }
            })
          );
        });

        // Wait for images to load
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create canvas from the rendered grid
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Canvas context not available');
        }

        // Find the grid container in the temporary container
        const gridElement = tempContainer.querySelector('[class*="grid"]') || tempContainer.firstElementChild;
        
        if (gridElement) {
          // Use html2canvas to capture the grid
          const html2canvas = await import('html2canvas');
          const canvasResult = await html2canvas.default(gridElement as HTMLElement, {
            width: 400,
            height: 400,
            backgroundColor: '#ffffff',
            scale: 1,
            logging: false,
            useCORS: true,
            allowTaint: true,
          });

          // Get the data URL
          const dataUrl = canvasResult.toDataURL('image/png', 0.9);
          
          console.log('Successfully generated variant image for:', variant.id);
          onRendered(variant.id, dataUrl);
        } else {
          console.error('No grid element found in rendered component');
          onRendered(variant.id, '');
        }

        // Cleanup
        root.unmount();
        document.body.removeChild(tempContainer);

      } catch (error) {
        console.error('Error generating variant image:', error);
        onRendered(variant.id, '');
      }
    };

    // Start generation with a delay to ensure component is ready
    const timer = setTimeout(generateVariantImage, 300);
    return () => clearTimeout(timer);
  }, [variant, onRendered, order]);

  // Hidden canvas for any additional processing if needed
  return (
    <div ref={containerRef} className="hidden">
      <canvas ref={canvasRef} />
    </div>
  );
};
