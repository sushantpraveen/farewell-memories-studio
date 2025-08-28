
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
  
  // Calculate grid dimensions - use the exact same logic as the original templates
  const memberCount = order.members.length;
  let cols = 0, rows = 0;
  
  // This matches the logic used in the square grid components
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
  
  console.log('Grid layout:', cols, 'x', rows, 'for', memberCount, 'members');
  
  // For each member that can be in the center, create a variant
  for (let centerMemberIndex = 0; centerMemberIndex < membersWithPhotos.length; centerMemberIndex++) {
    const centerMember = membersWithPhotos[centerMemberIndex];
    
    // Calculate the actual center position in the grid
    const centerRow = Math.floor(rows / 2);
    const centerCol = Math.floor(cols / 2);
    const centerIndex = centerRow * cols + centerCol;
    
    // Create a new arrangement with the selected member at the center
    const variantMembers: AdminMember[] = new Array(memberCount);
    
    // First, place the center member
    const centerMemberOriginalIndex = order.members.findIndex(m => m.id === centerMember.id);
    if (centerMemberOriginalIndex !== -1) {
      variantMembers[centerIndex] = centerMember;
    }
    
    // Then fill the rest of the positions with other members
    let sourceIndex = 0;
    for (let i = 0; i < memberCount; i++) {
      if (i === centerIndex) {
        continue; // Skip the center position as it's already filled
      }
      
      // Skip the center member when filling other positions
      while (sourceIndex < order.members.length && 
             order.members[sourceIndex].id === centerMember.id) {
        sourceIndex++;
      }
      
      if (sourceIndex < order.members.length) {
        variantMembers[i] = order.members[sourceIndex];
        sourceIndex++;
      }
    }
    
    // Filter out any undefined entries and ensure we have the right number of members
    const finalMembers = variantMembers.filter(m => m !== undefined).slice(0, memberCount);
    
    console.log(`Variant ${centerMemberIndex + 1}: ${centerMember.name} at center position ${centerIndex}`);
    console.log('Members arrangement:', finalMembers.map(m => m.name));
    
    variants.push({
      id: `variant-${centerMember.id}`,
      centerMember,
      members: finalMembers,
      centerIndex,
    });
    
    // Yield to prevent blocking
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  console.log('Generated', variants.length, 'variants');
  return variants;
}
