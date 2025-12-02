import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createAmbassador } from '@/lib/ambassadorApi';
import { toast } from 'sonner';
import PhoneOtpBlock from '@/components/otp/PhoneOtpBlock';

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
      const ambassador = await createAmbassador({
        name: formData.name,
        email: formData.email,
        phone: verifiedPhone,
        college: formData.college,
        city: formData.city,
      });
      toast.success('Welcome! Your ambassador account has been created');
      navigate(`/ambassador/${ambassador.id}`);
    } catch (err: any) {
      const message = err?.message || 'Failed to create ambassador';
      toast.error(message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

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
              Sign Up as Ambassador
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
