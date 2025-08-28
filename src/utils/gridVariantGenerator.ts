
import { Order, AdminMember } from '@/types/admin';
import { getCenterCellIndex } from './gridCenterUtils';

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
  
  // Calculate grid dimensions
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

  const totalCells = cols * rows;
  const centerIndex = Math.floor(totalCells / 2); // True center for most cases
  
  console.log('Grid layout:', cols, 'x', rows, 'center at index:', centerIndex);
  
  // Create variants - one for each member that can be in center
  for (let i = 0; i < membersWithPhotos.length; i++) {
    const centerMember = membersWithPhotos[i];
    
    // Create a proper arrangement with the selected member at center
    const variantMembers: AdminMember[] = [];
    
    // Fill all positions, placing center member at center index
    let memberIndex = 0;
    
    for (let pos = 0; pos < Math.min(totalCells, order.members.length); pos++) {
      if (pos === centerIndex) {
        // Place the center member
        variantMembers[pos] = centerMember;
      } else {
        // Fill with other members, skipping the center member
        while (memberIndex < order.members.length && 
               order.members[memberIndex].id === centerMember.id) {
          memberIndex++;
        }
        
        if (memberIndex < order.members.length) {
          variantMembers[pos] = order.members[memberIndex];
          memberIndex++;
        }
      }
    }
    
    // Ensure we have a complete array with no gaps
    const finalMembers = variantMembers.filter(m => m !== undefined);
    
    console.log(`Variant ${i + 1}: ${centerMember.name} at center (${finalMembers.length} total members)`);
    
    variants.push({
      id: `variant-${centerMember.id}`,
      centerMember,
      members: finalMembers,
      centerIndex,
    });
    
    // Yield to event loop to prevent blocking
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  console.log('Generated', variants.length, 'variants');
  return variants;
}
