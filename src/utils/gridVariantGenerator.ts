
import { Order, AdminMember } from '@/types/admin';

export interface GridVariant {
  id: string;
  centerMember: AdminMember;
  members: AdminMember[];
  centerIndex: number;
}

export async function generateGridVariants(order: Order): Promise<GridVariant[]> {
  const variants: GridVariant[] = [];
  
  // Validate order structure
  if (!order || !order.members || !Array.isArray(order.members)) {
    throw new Error('Invalid order data: members array is missing or invalid');
  }
  
  if (order.members.length === 0) {
    throw new Error('Order has no members');
  }
  
  if (!order.gridTemplate) {
    throw new Error('Order grid template is missing');
  }
  
  // Filter members with valid photos
  const membersWithPhotos = order.members.filter(m => {
    if (!m) return false;
    if (!m.photo) return false;
    if (typeof m.photo !== 'string') return false;
    return m.photo.trim() !== '';
  });
  
  console.log('[generateGridVariants] Order:', order.id);
  console.log('[generateGridVariants] Total members:', order.members.length);
  console.log('[generateGridVariants] Members with photos:', membersWithPhotos.length);
  console.log('[generateGridVariants] Members without photos:', order.members.length - membersWithPhotos.length);
  
  if (membersWithPhotos.length < 2) {
    throw new Error(`Not enough members with photos to generate variants (found ${membersWithPhotos.length}, need at least 2)`);
  }
  
  console.log('Generating variants for', membersWithPhotos.length, 'members with photos');
  console.log('Grid template:', order.gridTemplate);
  
  // Get the template-specific layout information
  const templateLayout = getTemplateLayout(order.gridTemplate, order.members.length);
  if (!templateLayout) {
    throw new Error(`Unsupported grid template: ${order.gridTemplate} with ${order.members.length} members`);
  }
  
  console.log('Template layout:', templateLayout);
  
  // For each member that can be in the center, create a variant
  for (let centerMemberIndex = 0; centerMemberIndex < membersWithPhotos.length; centerMemberIndex++) {
    const centerMember = membersWithPhotos[centerMemberIndex];
    
    if (!centerMember) {
      console.warn(`Skipping invalid center member at index ${centerMemberIndex}`);
      continue;
    }
    
    // Ensure member has an ID - use memberRollNumber as fallback
    const memberId = centerMember.id || centerMember.memberRollNumber || `member-${centerMemberIndex}`;
    if (!centerMember.id) {
      centerMember.id = memberId;
      console.log(`Assigned ID to member ${centerMember.name}: ${memberId}`);
    }
    
    // Create a new arrangement that preserves the original grid structure
    // Deep copy to avoid mutating the original, and ensure all members have IDs
    const variantMembers: AdminMember[] = order.members.map((m, idx) => {
      if (!m) return null;
      const member = { ...m };
      // Ensure each member has an ID
      if (!member.id) {
        member.id = member.memberRollNumber || `member-${idx}-${Date.now()}`;
      }
      return member;
    }).filter((m): m is AdminMember => m !== null);
    
    // Find where the desired center member currently is in the original grid
    // Try multiple matching strategies
    let currentMemberIndex = variantMembers.findIndex(m => m && (m.id === centerMember.id || m.id === memberId));
    
    // If still not found, try matching by memberRollNumber
    if (currentMemberIndex === -1 && centerMember.memberRollNumber) {
      currentMemberIndex = variantMembers.findIndex(m => m && m.memberRollNumber === centerMember.memberRollNumber);
    }
    
    // If still not found, try matching by name (last resort)
    if (currentMemberIndex === -1 && centerMember.name) {
      currentMemberIndex = variantMembers.findIndex(m => m && m.name === centerMember.name);
    }
    
    if (currentMemberIndex === -1) {
      console.error(`Center member ${centerMember.name} (ID: ${centerMember.id || memberId}) not found in order.members array`);
      console.error('Available member IDs:', variantMembers.map(m => ({ id: m.id, name: m.name, rollNo: m.memberRollNumber })));
      continue;
    }
    
    // Validate center index
    if (templateLayout.centerIndex >= variantMembers.length) {
      console.warn(`Center index ${templateLayout.centerIndex} is out of bounds for ${variantMembers.length} members`);
      // Use a safe fallback
      const safeCenterIndex = Math.min(templateLayout.centerIndex, variantMembers.length - 1);
      templateLayout.centerIndex = safeCenterIndex;
    }
    
    // Get the member currently at the center position
    const currentCenterMember = variantMembers[templateLayout.centerIndex];
    
    // Only swap if the desired member isn't already at the center
    if (currentMemberIndex !== templateLayout.centerIndex) {
      // Swap the members to preserve grid structure
      variantMembers[templateLayout.centerIndex] = centerMember;
      variantMembers[currentMemberIndex] = currentCenterMember || centerMember; // Fallback if currentCenterMember is undefined
      
      console.log(`Variant ${centerMemberIndex + 1}: Swapped ${centerMember.name} to center (${templateLayout.centerIndex}) and ${currentCenterMember?.name || 'unknown'} to position ${currentMemberIndex}`);
    } else {
      console.log(`Variant ${centerMemberIndex + 1}: ${centerMember.name} already at center position ${templateLayout.centerIndex}`);
    }
    
    console.log(`Variant ${centerMemberIndex + 1}: ${centerMember.name} at center position ${templateLayout.centerIndex}`);
    
    variants.push({
      id: `variant-${memberId}`,
      centerMember: { ...centerMember, id: memberId },
      members: variantMembers,
      centerIndex: templateLayout.centerIndex,
    });
    
    // Yield to prevent blocking
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  console.log('Generated', variants.length, 'variants');
  return variants;
}

// Template-specific layout information
export interface TemplateLayout {
  centerIndex: number;
  totalCells: number;
  gridDimensions: { cols: number; rows: number };
  description: string;
}

export function getTemplateLayout(template: string, memberCount: number): TemplateLayout | null {
  // For square templates, we need to match the exact layout logic
  if (template === 'square') {
    // These are the specific layouts used by the square templates
    if (memberCount === 19 || memberCount === 20) {
      // Template 19: 6x7 grid with 4x5 center cell, border cells around it
      // 19 border cells + 1 center = 20 total, but center is not indexed
      // Center is typically at the middle position in the member array
      return {
        centerIndex: Math.floor(memberCount / 2), // Center position in member array (9 for 19 members, 10 for 20)
        totalCells: 19,
        gridDimensions: { cols: 6, rows: 7 },
        description: '6x7 grid with 4x5 center cell, top/bottom rows, left/right sides'
      };
    } else if (memberCount === 34) {
      return {
        centerIndex: 8, // Center cell in 8x10 grid (row 1, col 1, spanning 6x6)
        totalCells: 34,
        gridDimensions: { cols: 8, rows: 10 },
        description: '8x10 grid with 6x6 center cell, top/bottom rows, left/right sides, bottom extension'
      };
    }
    else if (memberCount === 35) {
      return {
        centerIndex: 8,
        totalCells: 35,
        gridDimensions: { cols: 8, rows: 10 },
        description: '8x10 grid with 6x6 center cell, top/bottom rows, left/right sides, bottom extension'
      };
    } else if (memberCount === 69) {
      return {
        centerIndex: 20, // Center cell in 9x9 grid (row 2, col 2, spanning 5x5)
        totalCells: 69,
        gridDimensions: { cols: 9, rows: 9 },
        description: '9x9 grid with 5x5 center cell, surrounding cells in spiral pattern'
      };
    } else if (memberCount === 75) {
      return {
        centerIndex: 24, // Center cell in 8x10 grid (row 3, col 1, spanning 5x6)
        totalCells: 75,
        gridDimensions: { cols: 8, rows: 10 },
        description: '8x10 grid with 5x6 center cell, top/bottom rows, left/right sides, extensions'
      };
    }
    
    // For other square templates, use a fallback calculation
    const gridSize = Math.ceil(Math.sqrt(memberCount));
    const centerIndex = Math.floor(gridSize / 2) * gridSize + Math.floor(gridSize / 2);
    
    return {
      centerIndex: Math.min(centerIndex, memberCount - 1),
      totalCells: memberCount,
      gridDimensions: { cols: gridSize, rows: gridSize },
      description: `Fallback ${gridSize}x${gridSize} grid with calculated center`
    };
  }
  
  // For other template types, use fallback calculations
  if (template === 'hexagonal') {
    const gridSize = Math.ceil(Math.sqrt(memberCount));
    const centerIndex = Math.floor(gridSize / 2) * gridSize + Math.floor(gridSize / 2);
    
    return {
      centerIndex: Math.min(centerIndex, memberCount - 1),
      totalCells: memberCount,
      gridDimensions: { cols: gridSize, rows: gridSize },
      description: `Hexagonal ${gridSize}x${gridSize} grid with calculated center`
    };
  }
  
  if (template === 'circle') {
    const gridSize = Math.ceil(Math.sqrt(memberCount));
    const centerIndex = Math.floor(gridSize / 2) * gridSize + Math.floor(gridSize / 2);
    
    return {
      centerIndex: Math.min(centerIndex, memberCount - 1),
      totalCells: memberCount,
      gridDimensions: { cols: gridSize, rows: gridSize },
      description: `Circular ${gridSize}x${gridSize} grid with calculated center`
    };
  }
  
  return null;
}
