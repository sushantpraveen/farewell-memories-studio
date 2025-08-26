import React, { useState, useEffect, Suspense, lazy } from "react";
import { GridTemplate, Member } from "@/context/CollageContext";
import { HexagonalGrid } from "./grids/HexagonalGrid";
import { SquareGrid } from "./grids/SquareGrid";
import { CircleGrid } from "./grids/CircleGrid";
import { GridProvider } from "./square/context/GridContext";
import { centerCropFace } from "@/utils/faceCenterCrop";
import { useGrid } from "./square/context/GridContext";

interface GridPreviewProps {
  template: GridTemplate;
  memberCount: number;
  members?: Member[];
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  activeMember?: Member;
  centerEmptyDefault?: boolean;
}

const AnimatedPreloader = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        {/* Outer rotating ring */}
        <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600"></div>
        {/* Inner pulsing circle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-purple-600 rounded-full animate-pulse"></div>
      </div>
      
      {/* Animated dots */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 animate-pulse">Processing photos</p>
        <p className="text-xs text-gray-500 mt-1">Optimizing for best quality...</p>
      </div>
    </div>
  );
};

export const GridPreview: React.FC<GridPreviewProps> = ({ 
  template, 
  memberCount, 
  members = [], 
  size = 'medium',
  activeMember,
  centerEmptyDefault = false,
}) => {
  const [PreviewComp, setPreviewComp] = useState<React.LazyExoticComponent<React.ComponentType> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [processedActiveMember, setProcessedActiveMember] = useState<Member | null>(null);
  const [processedMembers, setProcessedMembers] = useState<Member[]>([]);

  // Map of all TSX components in this folder
  const componentModules = import.meta.glob('./square/*.tsx');

  // Process active member photo with face cropping
  useEffect(() => {
    const processActiveMember = async () => {
      if (!activeMember?.photo) {
        setProcessedActiveMember(null);
        return;
      }

      try {
        // Convert data URL to File object for face cropping
        const response = await fetch(activeMember.photo);
        const blob = await response.blob();
        const file = new File([blob], 'active-member-photo.jpg', { type: 'image/jpeg' });

        // Process with face cropping (use reasonable cell size)
        const cellSize = 256;
        const processedPhoto = await centerCropFace(file, cellSize, cellSize);
        
        setProcessedActiveMember({
          ...activeMember,
          photo: processedPhoto
        });
      } catch (error) {
        console.warn('Face cropping failed for active member:', error);
        // Fallback to original photo
        setProcessedActiveMember(activeMember);
      }
    };

    processActiveMember();
  }, [activeMember]);

  // Process existing members photos with face cropping
  useEffect(() => {
    const processMembers = async () => {
      if (!members.length) {
        setProcessedMembers([]);
        return;
      }

      console.log('Processing members:', members);

      const processed = await Promise.all(
        members.map(async (member) => {
          if (!member.photo) return member;

          try {
            // Convert data URL to File object for face cropping
            const response = await fetch(member.photo);
            const blob = await response.blob();
            const file = new File([blob], 'member-photo.jpg', { type: 'image/jpeg' });

            // Process with face cropping (use reasonable cell size)
            const cellSize = 256;
            const processedPhoto = await centerCropFace(file, cellSize, cellSize);
            
            console.log(`Processed member ${member.name}:`, processedPhoto);
            
            return {
              ...member,
              photo: processedPhoto
            };
          } catch (error) {
            console.warn('Face cropping failed for member:', member.name, error);
            // Fallback to original photo
            return member;
          }
        })
      );

      console.log('All members processed:', processed);
      setProcessedMembers(processed);
    };

    processMembers();
  }, [members]);

  // Load the specific grid template component based on member count
  useEffect(() => {
    const loadComponentByNumber = async (n: number) => {
      setLoadError(null);
      setPreviewComp(null);

      const path = `./square/${n}.tsx` as const;
      if (!/^[0-9]+\.tsx$/.test(`${n}.tsx`)) {
        setLoadError('Please enter a valid number.');
        return;
      }

      if (componentModules[path]) {
        try {
          const loader = componentModules[path] as () => Promise<{ default: React.ComponentType<any> }>;
          const LazyComp = lazy(loader);
          setPreviewComp(() => LazyComp);
        } catch (error) {
          console.error('Error loading component:', error);
          setLoadError(`Error loading component ${n}.tsx`);
        }
      } else {
        setLoadError(`Component ${n}.tsx not found in src/components/square.`);
      }
    };

    // Load the component based on member count
    if (memberCount > 0) {
      loadComponentByNumber(memberCount);
    }
  }, [memberCount]);

  // Combine all members for the grid display
  const allMembers = [...processedMembers];
  if (processedActiveMember) {
    // Add active member to the beginning so it appears in the center cell
    allMembers.unshift(processedActiveMember);
  }

  // If we have a specific grid template component, use it
  if (PreviewComp) {
    const GridComponent = PreviewComp as React.ComponentType<{
      previewMember?: Member;
      existingMembers?: Member[];
      centerEmptyDefault?: boolean;
    }>;
    
    // Show loading if members are still being processed
    if (members.length > 0 && processedMembers.length === 0) {
      // return (
      //   <div className="p-6 text-sm text-slate-600 text-center">
      //     Processing member photos...
      //   </div>
      // );
      return <AnimatedPreloader />;
    }
    
    return (
      <GridProvider>
        <Suspense fallback={<div className="p-6 text-sm text-slate-600">Loading grid template...</div>}>
          {/* Pass the processed active member as a prop to the grid template */}
          <GridComponent 
            previewMember={processedActiveMember}
            existingMembers={processedMembers}
            centerEmptyDefault={centerEmptyDefault}
          />
        </Suspense>
      </GridProvider>
    );
  }

  // Show error if there's a loading error
  if (loadError) {
    return (
      <div className="p-6 text-sm text-red-600 text-center">
        {loadError}
      </div>
    );
  }

  // Fallback to basic grid types if no specific template is found
  const commonProps = {
    memberCount,
    members: allMembers, // Use combined members including active member
    size
  };

  switch (template) {
    case 'hexagonal':
      return <HexagonalGrid {...commonProps} />;
    case 'circle':
      return <CircleGrid {...commonProps} />;
    case 'square':
    default:
      return <SquareGrid {...commonProps} />;
  }
};