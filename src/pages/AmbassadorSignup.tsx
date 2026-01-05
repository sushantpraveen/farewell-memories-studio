import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createAmbassador } from '@/lib/ambassadorApi';
import { toast } from 'sonner';
import PhoneOtpBlock from '@/components/otp/PhoneOtpBlock';
import { Clock, CheckCircle } from 'lucide-react';

export default function AmbassadorSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    college: '',
    city: '',
  });
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [waitlistId, setWaitlistId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.whatsapp || !formData.college || !formData.city) {
      toast.error('Please fill all fields');
      return;
    }

    if (!verifiedPhone) {
      toast.error('Please verify your phone number with the OTP before continuing');
      return;
    }

    try {
      const response = await createAmbassador({
        name: formData.name,
        email: formData.email,
        phone: verifiedPhone,
        college: formData.college,
        city: formData.city,
      });
      
      // Check if response has waitlistId (new waitlist flow)
      if ('waitlistId' in response && response.waitlistId) {
        setWaitlistId(response.waitlistId);
        setSubmitted(true);
        toast.success('Application submitted! Your request is pending admin approval.');
      } else if ('id' in response && response.id) {
        // Legacy flow - direct ambassador creation (shouldn't happen now)
        toast.success('Welcome! Your ambassador account has been created');
        navigate(`/ambassador/${response.id}`);
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to submit application';
      toast.error(message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Show waitlist status if submitted
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Application Submitted
            </CardTitle>
            <CardDescription>
              Your application is pending admin approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                Thank you for your interest in becoming a Campus Ambassador! 
                Your application has been submitted and is currently under review.
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                <strong>What happens next?</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Our team will review your application</li>
                <li>You'll receive an email notification once approved</li>
                <li>Upon approval, you'll get your unique referral link</li>
                <li>You can start earning rewards by sharing your link</li>
              </ul>
            </div>
            {waitlistId && (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Application ID: {waitlistId}
              </div>
            )}
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                setSubmitted(false);
                setWaitlistId(null);
                setFormData({
                  name: '',
                  email: '',
                  whatsapp: '',
                  college: '',
                  city: '',
                });
                setVerifiedPhone(null);
              }}
            >
              Submit Another Application
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Become a Campus Ambassador</CardTitle>
          <CardDescription>
            Earn rewards by promoting SignatureDay at your campus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="college">College Name</Label>
              <Input
                id="college"
                name="college"
                value={formData.college}
                onChange={handleChange}
                placeholder="Your College"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Your City"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <PhoneOtpBlock
                value={formData.whatsapp}
                onChange={(val) => {
                  setFormData(prev => ({ ...prev, whatsapp: val }));
                  setVerifiedPhone(null);
                }}
                onVerified={(normalized) => setVerifiedPhone(normalized)}
                source="ambassadorSignup"
              />
              {!verifiedPhone && (
                <p className="text-xs text-slate-600">Verify your phone via OTP to continue.</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={!verifiedPhone}>
              Registered as Ambassador
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
