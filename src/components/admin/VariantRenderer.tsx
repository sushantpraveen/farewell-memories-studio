
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
      if (!containerRef.current) return;

      try {
        // Convert admin members to collage members format
        const convertedMembers: Member[] = variant.members.map(member => ({
          id: member.id,
          name: member.name,
          photo: member.photo,
          vote: (member.vote || 'square') as Member['vote'],
          joinedAt: new Date(member.joinedAt),
          memberRollNumber: member.memberRollNumber
        }));

        // Wait for the component to render
        await new Promise(resolve => setTimeout(resolve, 100));

        // Find the canvas in the rendered component and extract the image
        const canvas = containerRef.current?.querySelector('canvas');
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/png');
          onRendered(variant.id, dataUrl);
        } else {
          console.warn(`No canvas found for variant ${variant.id}`);
        }
      } catch (error) {
        console.error(`Error rendering variant ${variant.id}:`, error);
      }
    };

    renderVariant();
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
    <div ref={containerRef} className="absolute -top-[9999px] -left-[9999px] w-64 h-64">
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
