import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollage, GridTemplate, Group } from '@/context/CollageContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import { uploadToCloudinary } from '@/lib/cloudinary';

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
  // Holds the Cloudinary URL to send to backend on submit (original-quality upload)
  const [submitPhotoUrl, setSubmitPhotoUrl] = useState<string>("");
  // Track the latest preview object URL to revoke it safely later
  const lastObjectUrlRef = useRef<string | null>(null);
  // Track upload status to control UI (e.g., disable submit while uploading)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

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

    // 1) Instant preview with object URL (no local face cropping)
    const objectUrl = URL.createObjectURL(file);
    // Revoke any previous object URL before assigning a new one
    if (lastObjectUrlRef.current && lastObjectUrlRef.current !== objectUrl) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
    }
    lastObjectUrlRef.current = objectUrl;
    setMemberData(prev => ({ ...prev, photo: objectUrl }));

    // 2) Upload original to Cloudinary in the background
    console.debug('[JoinGroup] Starting Cloudinary upload for original file', { name: file.name, size: file.size, type: file.type });
    const uploadToast = toast.loading('Uploading photo...');
    setIsUploadingPhoto(true);
    try {
      const result = await uploadToCloudinary(file, 'groups');
      setSubmitPhotoUrl(result.secure_url);
      // Update preview to Cloudinary URL so GridPreview applies server-side face crop
      setMemberData(prev => ({ ...prev, photo: result.secure_url }));
      // Now that Cloudinary URL is used, revoke the temporary object URL
      if (lastObjectUrlRef.current) {
        URL.revokeObjectURL(lastObjectUrlRef.current);
        lastObjectUrlRef.current = null;
      }
      console.debug('[JoinGroup] Cloudinary upload success', { public_id: result.public_id, secure_url_sample: result.secure_url.slice(0, 60) + '...' });
      toast.success('Upload complete', { id: uploadToast });
    } catch (uploadErr) {
      console.error('[JoinGroup] Cloudinary upload failed', uploadErr);
      toast.error('Photo upload failed. You can still submit, but it may be slower.', { id: uploadToast });
      setSubmitPhotoUrl('');
    } finally {
      // If upload failed, keep the object URL alive so other components don't break.
      // We'll clean it up on unmount or on next successful upload.
      setIsUploadingPhoto(false);
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
      // Prefer Cloudinary URL if available to keep payload small and preserve original quality
      const payload = {
        ...memberData,
        photo: submitPhotoUrl || memberData.photo,
      };
      console.debug('[JoinGroup] Submitting join payload', {
        usesCloudinary: Boolean(submitPhotoUrl),
        photoPreviewType: memberData.photo?.slice(0, 15),
      });
      const success = await joinGroup(groupId, payload);
      if (success) {
        await updateUser({ 
          groupId,
          isLeader: false  // Explicitly set to false for group members
        });
        toast.success("Successfully joined the group!");
        navigate('/');
      } else {
        toast.error("Unable to join group. It might be full or not exist.");
      }
    } catch (error) {
      console.error("Join group error:", error);
      toast.error("Failed to join group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [groupId, memberData, submitPhotoUrl, validateForm, joinGroup, updateUser, navigate]);

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
            // Use actual members from API to ensure correct counts
            members: Array.isArray((groupData as any).members) ? (groupData as any).members : [],
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

  // Cleanup on unmount: revoke any lingering object URL
  useEffect(() => {
    return () => {
      if (lastObjectUrlRef.current) {
        URL.revokeObjectURL(lastObjectUrlRef.current);
        lastObjectUrlRef.current = null;
      }
    };
  }, []);

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
    handleSubmit,
    submitPhotoUrl,
    isUploadingPhoto
  };
};
