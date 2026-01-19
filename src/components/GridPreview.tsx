import React, { useState, useEffect, Suspense, lazy } from "react";
import { GridTemplate, Member } from "@/context/CollageContext";
import { HexagonalGrid } from "./grids/HexagonalGrid";
import { SquareGrid } from "./grids/SquareGrid";
import { CircleGrid } from "./grids/CircleGrid";
import { GridProvider } from "./square/context/GridContext";
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

// Helpers: detect and transform Cloudinary URLs for server-side face cropping
const isCloudinaryUrl = (url: string): boolean => {
  return typeof url === 'string' && url.includes('/image/upload');
};

// Insert transformation segment into Cloudinary delivery URL
// Example: https://res.cloudinary.com/<cloud>/image/upload/v123/abc.jpg
//   -> https://res.cloudinary.com/<cloud>/image/upload/c_fill,g_face,w_256,h_256,q_auto,f_auto/v123/abc.jpg
const withCloudinaryTransform = (url: string, transform: string): string => {
  try {
    return url.replace('/image/upload/', `/image/upload/${transform}/`);
  } catch {
    return url;
  }
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
  const [zoomLevel, setZoomLevel] = useState<number>(0.4); // Zoom state for user adjustment
  const [showZoomControls, setShowZoomControls] = useState<boolean>(false);
  // In-memory cache for processed photos to avoid re-running face-api on identical inputs
  const cacheRef = React.useRef<Map<string, string>>(new Map());

  const makeKey = (m: Member) => {
    const id = (m as any).id || (m as any)._id || m.name || 'unknown';
    const p = m.photo || '';
    // Use a short signature to keep keys compact but stable
    return `${id}:${p.length}:${p.slice(0, 64)}`;
  };

  // Map of all TSX components in this folder
  const componentModules = import.meta.glob('./square/*.tsx');

  // Map size to target pixel dimension for Cloudinary transforms
  const targetPx = React.useMemo(() => {
    switch (size) {
      case 'small': return 160;
      case 'medium': return 224;
      case 'xlarge': return 352;
      case 'large':
      default: return 288;
    }
  }, [size]);

  // Face-aware gravity with dynamic zoom level
  const cloudTransform = React.useMemo(
    () => `c_thumb,g_auto:face,z_${zoomLevel.toFixed(1)},ar_1:1,w_${targetPx},h_${targetPx},q_auto,f_auto,dpr_auto`,
    [targetPx, zoomLevel]
  );

  // Process active member photo with face cropping
  useEffect(() => {
    const processActiveMember = async () => {
      if (!activeMember?.photo) {
        setProcessedActiveMember(null);
        return;
      }

      try {
        // If Cloudinary URL, use server-side subject-aware crop
        if (!activeMember.photo.startsWith('data:') && isCloudinaryUrl(activeMember.photo)) {
          const transformed = withCloudinaryTransform(activeMember.photo, cloudTransform);
          setProcessedActiveMember({ ...activeMember, photo: transformed });
          return;
        }
        // For data URLs or non-Cloudinary remote URLs, do not run any client-side face processing.
        // Use the original image as provided.
        setProcessedActiveMember(activeMember);
      } catch (error) {
        console.warn('Face cropping failed for active member:', error);
        // Fallback to original photo
        setProcessedActiveMember(activeMember);
      }
    };

    processActiveMember();
  }, [activeMember, cloudTransform]);

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
          // If Cloudinary URL, use server-side subject-aware crop
          if (!member.photo.startsWith('data:') && isCloudinaryUrl(member.photo)) {
            const transformed = withCloudinaryTransform(member.photo, cloudTransform);
            processed.push({ ...member, photo: transformed });
            continue;
          }
          // For data URLs or non-Cloudinary URLs, keep the original image without client-side face processing
          processed.push(member);
        } catch (error) {
          console.warn('Face cropping failed for member:', member.name, error);
          // Fallback to original photo
          processed.push(member);
        }
      }

      setProcessedMembers(processed);
    };

    processMembers();
  }, [members, cloudTransform]);

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
        setLoadError(`Template ${n} will be available soon.`);
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

  // Zoom control handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2.0)); // Max zoom 2.0
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.1)); // Min zoom 0.1
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomLevel(parseFloat(e.target.value));
  };

  const handleResetZoom = () => {
    setZoomLevel(0.4); // Reset to default
  };

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
      <div className="relative">
        {/* Floating Zoom Toolbar */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20"
          onMouseEnter={() => setShowZoomControls(true)}
          onMouseLeave={() => setShowZoomControls(false)}
          onFocus={() => setShowZoomControls(true)}
          onBlur={(e) => {
            // Only hide if focus is leaving the entire toolbar
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setShowZoomControls(false);
            }
          }}
        >
          {/* Compact trigger button when collapsed */}
          {!showZoomControls && (
            <button
              className="bg-white/95 backdrop-blur-sm shadow-lg rounded-full p-2 hover:bg-white transition-all border border-gray-200"
              aria-label="Show zoom controls"
              title="Zoom controls"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </button>
          )}

          {/* Expanded toolbar */}
          {showZoomControls && (
            <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-full px-4 py-2 flex items-center gap-3 border border-gray-200">
              {/* Zoom Out */}
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.1}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-purple-600 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-gray-100 disabled:hover:text-gray-700"
                aria-label="Zoom out"
                title="Zoom out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>

              {/* Slider */}
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  value={zoomLevel}
                  onChange={handleSliderChange}
                  className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  aria-label="Zoom level"
                  title={`Zoom: ${Math.round(zoomLevel * 100)}%`}
                />
                <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
              </div>

              {/* Zoom In */}
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 2.0}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-purple-600 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-gray-100 disabled:hover:text-gray-700"
                aria-label="Zoom in"
                title="Zoom in"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* Reset to Default */}
              <button
                onClick={handleResetZoom}
                className="text-xs font-medium text-gray-600 hover:text-purple-600 px-2 py-1 rounded hover:bg-purple-50 transition-colors"
                aria-label="Reset zoom to default"
                title="Reset zoom"
              >
                Reset
              </button>
            </div>
          )}
        </div>

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
      </div>
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