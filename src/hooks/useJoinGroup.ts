import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollage, GridTemplate, Group } from '@/context/CollageContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { debounce } from 'lodash';

interface MemberData {
  name: string;
  memberRollNumber: string;
  photo: string;
  vote: GridTemplate;
  size: undefined | 's' | 'm' | 'l' | 'xl' | 'xxl';
}

interface Errors {
  name: string;
  memberRollNumber: string;
  photo: string;
  size: string;
}

export const useJoinGroup = (groupId: string | undefined) => {
  // Navigation
  const navigate = useNavigate();

  // Context
  const { getGroup, joinGroup, updateGroupTemplate, isLoading } = useCollage();
  const { updateUser } = useAuth();

  // State
  const [memberData, setMemberData] = useState<MemberData>({
    name: "",
    memberRollNumber: "",
    photo: "",
    vote: "square",
    size: undefined
  });

  const [errors, setErrors] = useState<Errors>({
    name: "",
    memberRollNumber: "",
    photo: "",
    size: ""
  });

  const [group, setGroup] = useState<Group | undefined>(undefined);
  const [previewTemplate, setPreviewTemplate] = useState<GridTemplate>("square");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState<boolean>(true);

  // Validation
  const validateForm = useCallback((data: MemberData) => {
    const newErrors = {
      name: "",
      memberRollNumber: "",
      photo: "",
      size: ""
    };
    
    if (!data.name) {
      newErrors.name = "Name is required";
    } else if (data.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    
    if (!data.memberRollNumber) {
      newErrors.memberRollNumber = "Roll number is required";
    }
    
    if (!data.photo) {
      newErrors.photo = "Photo is required";
    }
    
    if (!data.size) {
      newErrors.size = "Size selection is required";
    }
    
    return newErrors;
  }, []);

  // Memoized handlers to prevent unnecessary re-renders
  const handleInputChange = useCallback((field: string, value: any) => {
    setMemberData(prev => ({ ...prev, [field]: value }));
    if (!formTouched) setFormTouched(true);
  }, []); // Remove formTouched dependency as it's only used in a condition

  const debouncedValidate = useCallback(
    debounce((data: MemberData) => {
      const newErrors = validateForm(data);
      setErrors(newErrors);
    }, 500), // Increased debounce time to reduce validation frequency
    [validateForm]
  );

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large. Please select an image under 5MB.");
      return;
    }
    
    const toastId = toast.loading("Processing image...");
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const quickPreview = event.target?.result as string;
        setMemberData(prev => ({ ...prev, photo: quickPreview }));
        
        try {
          toast.loading("Optimizing image...", { id: toastId });
          
          const [compressionModule, faceDetectionModule] = await Promise.all([
            import('@/utils/imageCompression'),
            import('@/utils/faceDetectionService')
          ]);
          
          const compressedImage = await compressionModule.compressToTargetSize(file, 150);
          toast.loading("Detecting face...", { id: toastId });
          
          try {
            await faceDetectionModule.initFaceDetectionWorker();
            const response = await fetch(compressedImage);
            const blob = await response.blob();
            const processedFile = new File([blob], 'processed.jpg', { type: 'image/jpeg' });
            const finalImage = await faceDetectionModule.cropFace(processedFile, 100, 100);
            
            setMemberData(prev => ({ ...prev, photo: finalImage }));
            toast.success("Image processed successfully", { id: toastId });
          } catch (faceError) {
            console.warn("Face detection failed, using compressed image:", faceError);
            setMemberData(prev => ({ ...prev, photo: compressedImage }));
            toast.success("Image compressed successfully", { id: toastId });
          }
        } catch (processingError) {
          console.error("Image processing failed:", processingError);
          toast.error("Optimization failed, using original image", { id: toastId });
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error("Failed to process image", { id: toastId });
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    
    const newErrors = validateForm(memberData);
    setErrors(newErrors);
    
    if (Object.values(newErrors).some(error => error)) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await joinGroup(groupId, memberData);
      if (success) {
        await updateUser({ groupId });
        toast.success("Successfully joined the group!");
        navigate(`/`);
      } else {
        toast.error("Unable to join group. It might be full or not exist.");
      }
    } catch (error) {
      console.error("Join group error:", error);
      toast.error("Failed to join group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [groupId, memberData, validateForm, joinGroup, updateUser, navigate]);

  // Effects
  // Memoize validation effect to prevent unnecessary reruns
  useEffect(() => {
    if (!formTouched) return;
    
    const validationTimeout = setTimeout(() => {
      debouncedValidate(memberData);
    }, 500);

    return () => {
      clearTimeout(validationTimeout);
      debouncedValidate.cancel();
    };
  }, [memberData, formTouched, debouncedValidate]);

  // Optimized group data fetching with delayed loading state
  useEffect(() => {
    if (!groupId) return;

    let isMounted = true;
    let loadingTimeout: NodeJS.Timeout;

    const fetchGroup = async () => {
      try {
        // Only show loading state if fetch takes longer than 200ms
        loadingTimeout = setTimeout(() => {
          if (isMounted) setLoadingGroup(true);
        }, 200);

        const groupData = await getGroup(groupId);
        if (!isMounted) return;

        if (groupData) {
          // Extract only the fields we need for the join form
          const { id, name, yearOfPassing, totalMembers, gridTemplate } = groupData;
          setGroup({
            id,
            name,
            yearOfPassing,
            totalMembers,
            gridTemplate,
            members: [], // Empty array for member count only
            shareLink: '', // Not needed for join form
            createdAt: new Date(),
            votes: { hexagonal: 0, square: 0, circle: 0 }
          });
          setPreviewTemplate(gridTemplate);
        } else {
          setGroup(undefined);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to fetch group:", error);
        toast.error("Failed to load group data");
      } finally {
        if (isMounted) {
          clearTimeout(loadingTimeout);
          setLoadingGroup(false);
        }
      }
    };

    fetchGroup();

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
    };
  }, [groupId, getGroup]);

  return {
    memberData,
    errors,
    group,
    previewTemplate,
    isSubmitting,
    loadingGroup,
    isLoading,
    formTouched,
    handleInputChange,
    handlePhotoUpload,
    handleSubmit
  };
};
