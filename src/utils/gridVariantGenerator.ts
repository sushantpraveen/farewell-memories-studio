
import { Order, AdminMember } from '@/types/admin';

export interface GridVariant {
  id: string;
  centerMember: AdminMember;
  members: AdminMember[];
  centerIndex: number;
}

export async function generateGridVariants(order: Order): Promise<GridVariant[]> {
  const variants: GridVariant[] = [];
  const membersWithPhotos = order.members.filter(m => m.photo && m.photo.trim() !== '');
  
  if (membersWithPhotos.length < 2) {
    throw new Error('Not enough members with photos to generate variants');
  }
  
  console.log('Generating variants for', membersWithPhotos.length, 'members with photos');
  
  // Calculate grid dimensions - use the exact same logic as the components
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

  console.log('Grid layout:', cols, 'x', rows, 'for', memberCount, 'members');
  
  // Calculate the center position in the grid
  const centerRow = Math.floor(rows / 2);
  const centerCol = Math.floor(cols / 2);
  const centerIndex = centerRow * cols + centerCol;
  
  console.log('Center position: row', centerRow, 'col', centerCol, 'index', centerIndex);
  
  // For each member that can be in the center, create a variant
  for (let centerMemberIndex = 0; centerMemberIndex < membersWithPhotos.length; centerMemberIndex++) {
    const centerMember = membersWithPhotos[centerMemberIndex];
    
    // Create a new arrangement with the selected member at the center
    const variantMembers: AdminMember[] = [...order.members];
    
    // Find the original center member and swap with the selected center member
    const originalCenterMemberIndex = order.members.findIndex(m => m.id === centerMember.id);
    
    if (originalCenterMemberIndex !== -1 && centerIndex < variantMembers.length) {
      // Swap the members
      const originalCenterMember = variantMembers[centerIndex];
      variantMembers[centerIndex] = centerMember;
      variantMembers[originalCenterMemberIndex] = originalCenterMember;
    }
    
    console.log(`Variant ${centerMemberIndex + 1}: ${centerMember.name} at center position ${centerIndex}`);
    console.log('Members arrangement:', variantMembers.map(m => m.name));
    
    variants.push({
      id: `variant-${centerMember.id}`,
      centerMember,
      members: variantMembers,
      centerIndex,
    });
    
    // Yield to prevent blocking
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  console.log('Generated', variants.length, 'variants');
  return variants;
}
