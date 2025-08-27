
import { Order, AdminMember } from '@/types/admin';
import { getCenterCellIndex } from './gridCenterUtils';

export interface GridVariant {
  id: string;
  centerMember: AdminMember;
  members: AdminMember[];
  centerIndex: number;
}

export async function generateGridVariants(order: Order): Promise<GridVariant[]> {
  const centerIndex = getCenterCellIndex(order);
  const variants: GridVariant[] = [];
  const membersWithPhotos = order.members.filter(m => m.photo && m.photo.trim() !== '');
  
  if (membersWithPhotos.length < 2) {
    throw new Error('Not enough members with photos to generate variants');
  }
  
  // Create variants - one for each member that can be in center
  for (let i = 0; i < membersWithPhotos.length; i++) {
    const centerMember = membersWithPhotos[i];
    
    // Create a new arrangement with this member in the center
    const variantMembers = [...order.members];
    
    // Place the selected member at the center position
    if (centerIndex < variantMembers.length) {
      // Remove the center member from its current position
      const memberIndex = variantMembers.findIndex(m => m.id === centerMember.id);
      if (memberIndex !== -1) {
        variantMembers.splice(memberIndex, 1);
      }
      
      // Insert at center position
      variantMembers.splice(centerIndex, 0, centerMember);
    }
    
    variants.push({
      id: `variant-${centerMember.id}`,
      centerMember,
      members: variantMembers,
      centerIndex,
    });
    
    // Yield to event loop to prevent blocking
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return variants;
}
