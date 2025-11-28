import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AmbassadorStorageService } from '@/lib/ambassadorStorage';
import { toast } from 'sonner';

export default function AmbassadorSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    college: '',
    city: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.whatsapp || !formData.college || !formData.city) {
      toast.error('Please fill all fields');
      return;
    }

    // Check if email already exists
    const existingAmbassador = AmbassadorStorageService.getAmbassadorByEmail(formData.email);
    if (existingAmbassador) {
      toast.error('This email is already registered as an ambassador');
      return;
    }

    // Create ambassador
    const ambassador = AmbassadorStorageService.createAmbassador(formData);
    
    toast.success('Welcome! Your ambassador account has been created');
    
    // Navigate to dashboard
    navigate(`/ambassador/${ambassador.id}`);
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
              <Input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="+91 9876543210"
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Sign Up as Ambassador
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
