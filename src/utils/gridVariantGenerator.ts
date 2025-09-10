
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
  console.log('Grid template:', order.gridTemplate);
  
  // Get the template-specific layout information
  const templateLayout = getTemplateLayout(order.gridTemplate, order.members.length);
  if (!templateLayout) {
    throw new Error(`Unsupported grid template: ${order.gridTemplate}`);
  }
  
  console.log('Template layout:', templateLayout);
  
  // For each member that can be in the center, create a variant
  for (let centerMemberIndex = 0; centerMemberIndex < membersWithPhotos.length; centerMemberIndex++) {
    const centerMember = membersWithPhotos[centerMemberIndex];
    
    // Create a new arrangement that preserves the original grid structure
    const variantMembers: AdminMember[] = [...order.members];
    
    // Find where the desired center member currently is in the original grid
    const currentMemberIndex = variantMembers.findIndex(m => m.id === centerMember.id);
    
    if (currentMemberIndex !== -1) {
      // Get the member currently at the center position
      const currentCenterMember = variantMembers[templateLayout.centerIndex];
      
      // Only swap if the desired member isn't already at the center
      if (currentMemberIndex !== templateLayout.centerIndex) {
        // Swap the members to preserve grid structure
        variantMembers[templateLayout.centerIndex] = centerMember;
        variantMembers[currentMemberIndex] = currentCenterMember;
        
        console.log(`Variant ${centerMemberIndex + 1}: Swapped ${centerMember.name} to center (${templateLayout.centerIndex}) and ${currentCenterMember.name} to position ${currentMemberIndex}`);
      } else {
        console.log(`Variant ${centerMemberIndex + 1}: ${centerMember.name} already at center position ${templateLayout.centerIndex}`);
      }
    }
    
    console.log(`Variant ${centerMemberIndex + 1}: ${centerMember.name} at center position ${templateLayout.centerIndex}`);
    console.log('Members arrangement:', variantMembers.map((m, idx) => `${m.name}(${idx})`));
    
    variants.push({
      id: `variant-${centerMember.id}`,
      centerMember,
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
    if (memberCount === 34) {
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
