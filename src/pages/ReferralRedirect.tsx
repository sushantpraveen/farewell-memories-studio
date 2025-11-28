import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AmbassadorStorageService } from '@/lib/ambassadorStorage';
import { toast } from 'sonner';

export default function ReferralRedirect() {
  const { referralCode } = useParams<{ referralCode: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!referralCode) {
      navigate('/');
      return;
    }

    // Validate referral code
    const ambassador = AmbassadorStorageService.getAmbassadorByReferralCode(referralCode);
    
    if (!ambassador) {
      toast.error('Invalid referral code');
      navigate('/');
      return;
    }

    // Store the referral code in localStorage for later use
    AmbassadorStorageService.setActiveReferral(referralCode);
    
    toast.success(`Welcome! You're creating a group via ${ambassador.name}'s referral`);
    
    // Redirect to create group page
    navigate('/create-group');
  }, [referralCode, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
