
import React, { useRef, useEffect } from 'react';
import { GridPreview } from '@/components/GridPreview';
import { GridProvider } from '@/components/square/context/GridContext';
import { Order } from '@/types/admin';
import { GridVariant } from '@/utils/gridVariantGenerator';
import { Member } from '@/context/CollageContext';

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderVariant = async () => {
      if (!containerRef.current) {
        console.warn('Container ref not available for variant', variant.id);
        return;
      }

      try {
        console.log('Starting render for variant:', variant.id, 'Center member:', variant.centerMember.name);
        
        // Convert admin members to collage members format
        const convertedMembers: Member[] = variant.members.map(member => ({
          id: member.id,
          name: member.name,
          photo: member.photo,
          vote: (member.vote || 'square') as Member['vote'],
          joinedAt: new Date(member.joinedAt),
          memberRollNumber: member.memberRollNumber
        }));

        console.log('Converted members for variant:', variant.id, convertedMembers.length);

        // Wait for the component to render completely
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Look for canvas in multiple ways
        let canvas: HTMLCanvasElement | null = null;
        let attempts = 0;
        const maxAttempts = 15;

        while (!canvas && attempts < maxAttempts) {
          // Try different selectors
          canvas = containerRef.current?.querySelector('canvas') ||
                   document.querySelector(`#variant-${variant.id} canvas`) ||
                   containerRef.current?.querySelector('div canvas');
          
          if (!canvas) {
            console.log(`Attempt ${attempts + 1}: No canvas found for variant ${variant.id}`);
            console.log('Container HTML:', containerRef.current?.innerHTML?.substring(0, 200));
            await new Promise(resolve => setTimeout(resolve, 300));
            attempts++;
          } else {
            console.log('Canvas found for variant:', variant.id, 'Canvas dimensions:', canvas.width, 'x', canvas.height);
          }
        }

        if (canvas && canvas.width > 0 && canvas.height > 0) {
          // Wait a bit more to ensure canvas is fully rendered
          await new Promise(resolve => setTimeout(resolve, 200));
          
          try {
            const dataUrl = canvas.toDataURL('image/png');
            if (dataUrl && dataUrl !== 'data:,') {
              console.log('Successfully generated image for variant:', variant.id);
              onRendered(variant.id, dataUrl);
            } else {
              console.error('Canvas produced empty data URL for variant:', variant.id);
            }
          } catch (canvasError) {
            console.error(`Error extracting canvas data for variant ${variant.id}:`, canvasError);
          }
        } else {
          console.error(`No valid canvas found for variant ${variant.id} after ${maxAttempts} attempts`);
          console.log('Final container contents:', containerRef.current?.innerHTML);
        }
      } catch (error) {
        console.error(`Error rendering variant ${variant.id}:`, error);
      }
    };

    // Start rendering after a short delay to ensure component is mounted
    const timer = setTimeout(renderVariant, 200);
    return () => clearTimeout(timer);
  }, [variant, onRendered]);

  // Convert admin members to collage members format
  const convertedMembers: Member[] = variant.members.map(member => ({
    id: member.id,
    name: member.name,
    photo: member.photo,
    vote: (member.vote || 'square') as Member['vote'],
    joinedAt: new Date(member.joinedAt),
    memberRollNumber: member.memberRollNumber
  }));

  return (
    <div 
      ref={containerRef} 
      id={`variant-${variant.id}`}
      className="absolute -top-[9999px] -left-[9999px] pointer-events-none"
      style={{ width: '500px', height: '500px' }}
    >
      <GridProvider>
        <GridPreview
          template={order.gridTemplate}
          memberCount={order.members.length}
          members={convertedMembers}
          size="medium"
        />
      </GridProvider>
    </div>
  );
};
