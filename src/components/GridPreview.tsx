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
  // In-memory cache for processed photos to avoid re-running face-api on identical inputs
  const cacheRef = React.useRef<Map<string, string>>(new Map());

  const makeKey = (m: Member) => {
    const id = (m as any).id || (m as any)._id || m.name || 'unknown';
    const p = m.photo || '';
    // Use a short signature to keep keys compact but stable
    return `${id}:${p.length}:${p.slice(0,64)}`;
  };

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
        // Check if the photo is a valid data URL
        if (!activeMember.photo.startsWith('data:') || activeMember.photo.length < 100) {
          console.warn(`Invalid photo data for active member, skipping face crop`);
          setProcessedActiveMember(activeMember);
          return;
        }
        // Cache hit?
        const cacheKey = makeKey(activeMember);
        const cached = cacheRef.current.get(cacheKey);
        if (cached) {
          setProcessedActiveMember({ ...activeMember, photo: cached });
          return;
        }
        
        // Create a blob from the data URL without using fetch API
        const base64Data = activeMember.photo.split(',')[1];
        if (!base64Data) {
          console.warn(`Invalid base64 data for active member, skipping face crop`);
          setProcessedActiveMember(activeMember);
          return;
        }
        
        try {
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const blob = new Blob([bytes], { type: 'image/jpeg' });
          const file = new File([blob], 'active-member-photo.jpg', { type: 'image/jpeg' });

          // Process with face cropping (use reasonable cell size)
          const cellSize = 256;
          const processedPhoto = await centerCropFace(file, cellSize, cellSize);
          
          // Save to cache and state
          cacheRef.current.set(cacheKey, processedPhoto);
          setProcessedActiveMember({ ...activeMember, photo: processedPhoto });
        } catch (e) {
          console.warn(`Base64 decode failed for active member, using original photo`, e);
          setProcessedActiveMember(activeMember);
        }
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

      // Process members one by one instead of all at once to avoid resource issues
      const processed = [];
      
      for (const member of members) {
        if (!member.photo) {
          processed.push(member);
          continue;
        }

        try {
          // Check if the photo is a valid data URL
          if (!member.photo.startsWith('data:') || member.photo.length < 100) {
            console.warn(`Invalid photo data for member ${member.name}, skipping face crop`);
            processed.push(member);
            continue;
          }
          // Cache hit?
          const cacheKey = makeKey(member);
          const cached = cacheRef.current.get(cacheKey);
          if (cached) {
            processed.push({ ...member, photo: cached });
            continue;
          }
          
          // Create a blob from the data URL without using fetch API
          const base64Data = member.photo.split(',')[1];
          if (!base64Data) {
            console.warn(`Invalid base64 data for member ${member.name}, skipping face crop`);
            processed.push(member);
            continue;
          }
          
          try {
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            const blob = new Blob([bytes], { type: 'image/jpeg' });
            const file = new File([blob], 'member-photo.jpg', { type: 'image/jpeg' });

            // Process with face cropping (use reasonable cell size)
            const cellSize = 256;
            const processedPhoto = await centerCropFace(file, cellSize, cellSize);
            
            cacheRef.current.set(cacheKey, processedPhoto);
            processed.push({ ...member, photo: processedPhoto });
          } catch (e) {
            console.warn(`Base64 decode failed for member ${member.name}, using original photo`, e);
            processed.push(member);
          }
        } catch (error) {
          console.warn('Face cropping failed for member:', member.name, error);
          // Fallback to original photo
          processed.push(member);
        }
        
        // Add a small delay between processing each member to avoid resource issues
        await new Promise(resolve => setTimeout(resolve, 100));
      }

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