import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollage, GridTemplate, Group } from '@/context/CollageContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { generateInvoicePdfBase64 } from '@/lib/invoice';
import { calculatePricing } from '@/lib/pricing';

interface MemberData {
  name: string;
  email: string;
  memberRollNumber: string;
  photo: string;
  vote: GridTemplate;
  size: undefined | 's' | 'm' | 'l' | 'xl' | 'xxl';
}

interface Errors {
  name: string;
  email: string;
  memberRollNumber: string;
  photo: string;
  size: string;
}

export const useJoinGroup = (groupId: string | undefined) => {
  // Navigation
  const navigate = useNavigate();

  // Context
  const { getGroup, joinGroup, updateGroupTemplate, isLoading } = useCollage();
  const { updateUser, user } = useAuth();

  // State
  const [memberData, setMemberData] = useState<MemberData>({
    name: "",
    email: "",
    memberRollNumber: "",
    photo: "",
    vote: "square",
    size: undefined
  });

  const [errors, setErrors] = useState<Errors>({
    name: "",
    email: "",
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

  // OTP phone verification state (optional)
  const [phone, setPhone] = useState<string>("");
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string>("");
  
  // Payment state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Validation
  const validateForm = useCallback((data: MemberData) => {
    const newErrors = {
      name: "",
      email: "",
      memberRollNumber: "",
      photo: "",
      size: ""
    };
    
    if (!data.name) {
      newErrors.name = "Name is required";
    } else if (data.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if(!data.email){
      newErrors.email = "Email is required";
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

  // Load Razorpay script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-sdk')) return resolve(true);
      const script = document.createElement('script');
      script.id = 'razorpay-sdk';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    
    const newErrors = validateForm(memberData);
    setErrors(newErrors);
    
    if (Object.values(newErrors).some(error => error)) {
      toast.error("Please fix the errors in the form");
      return;
    }

    if (!isPhoneVerified) {
      toast.error("Please verify your phone number first");
      return;
    }

    setIsSubmitting(true);
    setIsProcessingPayment(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay');
      }

      // Get auth token from sessionStorage if not already set
      const token = authToken || sessionStorage.getItem('otp_auth_token');
      if (!token) {
        toast.error("Authentication token not found. Please verify your phone again.");
        setIsSubmitting(false);
        setIsProcessingPayment(false);
        return;
      }

      // Create Razorpay order
      // Generate short receipt ID (max 40 chars for Razorpay)
      const timestamp = Date.now().toString().slice(-10); // Last 10 digits
      const shortGroupId = groupId?.slice(-8) || 'unknown'; // Last 8 chars of groupId
      const receipt = `join_${shortGroupId}_${timestamp}`; // ~25 chars total
      
      const orderResponse = await fetch('/api/payments/join/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: 39800, // ₹398 in paise
          currency: 'INR',
          receipt,
          notes: { groupId, phone }
        })
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const razorpayOrder = await orderResponse.json();

      // Get Razorpay key (public endpoint)
      const keyResponse = await fetch('/api/payments/key');
      
      if (!keyResponse.ok) {
        throw new Error('Failed to get Razorpay key');
      }

      const { keyId } = await keyResponse.json();

      // Prepare member data for payment verification
      const memberPayload = {
        name: memberData.name,
        email: memberData.email,
        memberRollNumber: memberData.memberRollNumber,
        photo: submitPhotoUrl || memberData.photo,
        vote: memberData.vote,
        size: memberData.size,
        phone
      };

      // Open Razorpay Checkout
      const options = {
        key: keyId,
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: group?.name || 'Signature Day',
        description: `Join ${group?.name} - Class of ${group?.yearOfPassing}`,
        order_id: razorpayOrder.id,
        prefill: {
          name: memberData.name,
          email: memberData.email,
          contact: phone
        },
        notes: { groupId },
        handler: async (response: any) => {
          try {
            // Generate invoice PDF before verification
            const joinPricing = calculatePricing({ quantity: 1, tshirtPrice: 299, printPrice: 99, gstRate: 0.05 });
            let invoiceBase64 = '';
            let invoiceFileName = '';
            
            try {
              invoiceBase64 = await generateInvoicePdfBase64(
                {
                  name: 'CHITLU INNOVATIONS PRIVATE LIMITED',
                  gstin: '36AAHCC5155C1ZW',
                  cin: 'U74999TG2018PTC123754',
                  logoUrl: '/chitlu-logo.png',
                },
                {
                  invoiceId: `INV-JOIN-${Date.now()}`,
                  dateISO: new Date().toISOString(),
                  customerName: memberData.name || 'Customer',
                  customerEmail: memberData.email,
                },
                [
                  {
                    description: `${group?.name || 'Group'} T-Shirt + Print (${group?.yearOfPassing || ''})`,
                    quantity: 1,
                    unitPrice: 299,
                    printPrice: 99,
                    gstRate: 0.05,
                  },
                ]
              );
              invoiceFileName = `Invoice-${group?.name || 'Join'}-${Date.now()}.pdf`;
            } catch (invoiceErr) {
              console.warn('Failed to generate invoice PDF:', invoiceErr);
              // Continue without invoice - non-blocking
            }

            // Verify payment and join group
            const verifyResponse = await fetch('/api/payments/join/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                groupId,
                memberData: memberPayload,
                invoicePdfBase64: invoiceBase64,
                invoiceFileName: invoiceFileName
              })
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.message || 'Payment verification failed');
            }

            // Check if user is already the leader of this group
            const isCurrentLeader = user?.isLeader && user?.groupId === groupId;
            
            // Only update user if they're not already the leader
            if (!isCurrentLeader) {
              await updateUser({ 
                groupId,
                isLeader: false
              });
            }

            toast.success("Payment successful! Welcome to the group!");
            
            // Navigate to success page
            navigate(`/success?groupId=${groupId}`);
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
          } finally {
            setIsSubmitting(false);
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled');
            setIsSubmitting(false);
            setIsProcessingPayment(false);
          }
        },
        theme: { color: '#6d28d9' }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment. Please try again.");
      setIsSubmitting(false);
      setIsProcessingPayment(false);
    }
  }, [groupId, memberData, submitPhotoUrl, validateForm, updateUser, navigate, isPhoneVerified, phone, authToken, group, user]);

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
    isUploadingPhoto,
    // OTP
    phone,
    setPhone,
    isPhoneVerified,
    setIsPhoneVerified,
    authToken,
    setAuthToken,
    // Payment
    isProcessingPayment
  };
};
