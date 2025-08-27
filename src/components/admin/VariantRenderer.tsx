
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
        console.log('Starting render for variant:', variant.id);
        
        // Convert admin members to collage members format
        const convertedMembers: Member[] = variant.members.map(member => ({
          id: member.id,
          name: member.name,
          photo: member.photo,
          vote: (member.vote || 'square') as Member['vote'],
          joinedAt: new Date(member.joinedAt),
          memberRollNumber: member.memberRollNumber
        }));

        // Wait longer for the component to render completely
        await new Promise(resolve => setTimeout(resolve, 500));

        // Try to find canvas multiple times with delays
        let canvas: HTMLCanvasElement | null = null;
        let attempts = 0;
        const maxAttempts = 10;

        while (!canvas && attempts < maxAttempts) {
          canvas = containerRef.current?.querySelector('canvas');
          if (!canvas) {
            console.log(`Attempt ${attempts + 1}: No canvas found for variant ${variant.id}, waiting...`);
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
          }
        }

        if (canvas) {
          console.log('Canvas found for variant:', variant.id);
          
          // Wait a bit more to ensure canvas is fully rendered
          await new Promise(resolve => setTimeout(resolve, 100));
          
          try {
            const dataUrl = canvas.toDataURL('image/png');
            console.log('Generated image for variant:', variant.id);
            onRendered(variant.id, dataUrl);
          } catch (canvasError) {
            console.error(`Error extracting canvas data for variant ${variant.id}:`, canvasError);
          }
        } else {
          console.error(`No canvas found for variant ${variant.id} after ${maxAttempts} attempts`);
        }
      } catch (error) {
        console.error(`Error rendering variant ${variant.id}:`, error);
      }
    };

    // Start rendering after a short delay to ensure component is mounted
    const timer = setTimeout(renderVariant, 100);
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
      className="absolute -top-[9999px] -left-[9999px] pointer-events-none"
      style={{ width: '400px', height: '400px' }}
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
