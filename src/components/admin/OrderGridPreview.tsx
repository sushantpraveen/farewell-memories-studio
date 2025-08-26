import React from 'react';
import { GridPreview } from '@/components/GridPreview';
import { GridProvider } from '@/components/square/context/GridContext';
import { Order } from '@/types/admin';
import { Member } from '@/context/CollageContext';

interface OrderGridPreviewProps {
  order: Order;
}

export const OrderGridPreview: React.FC<OrderGridPreviewProps> = ({ order }) => {
  // Convert admin members to collage members format
  const convertedMembers: Member[] = order.members.map(member => ({
    id: member.id,
    name: member.name,
    photo: member.photo,
    vote: (member.vote || 'square') as Member['vote'],
    joinedAt: new Date(member.joinedAt),
    memberRollNumber: member.memberRollNumber
  }));

  return (
    <div className="w-full h-full overflow-hidden rounded-lg border bg-gray-50">
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