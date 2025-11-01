import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, ShoppingCart, Users, Plus, Minus, MapPin, Loader2 } from 'lucide-react';
import { useCollage } from '@/context/CollageContext';
import type { Group } from '@/context/CollageContext';
import { ordersApi, paymentsApi } from '@/lib/api';
import type { Order, AdminMember } from '@/types/admin';
import { toast } from 'sonner';

// Subtle animated background consistent with GridBoard/Dashboard
const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 via-pink-400/10 to-yellow-400/10 animate-gradient-xy" />
    <div className="absolute inset-0 backdrop-blur-3xl" />
  </div>
);

const Checkout = () => {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId?: string }>();
  const { getGroup } = useCollage();
  
  // Load group data (getGroup is async)
  const [group, setGroup] = useState<Group | null>(null);

  // Helper functions for group storage
  const saveLastActiveGroup = (groupId: string) => {
    localStorage.setItem('lastActiveGroupId', groupId);
  };

  const getLastActiveGroup = (): string | null => {
    return localStorage.getItem('lastActiveGroupId');
  };

  // Handle route redirection for legacy routes without groupId
  useEffect(() => {
    // If no groupId in URL params, redirect to appropriate group
    if (!groupId) {
      // Try last active group from localStorage
      const lastActive = getLastActiveGroup();
      if (lastActive) {
        navigate(`/checkout/${lastActive}`, { replace: true });
        return;
      }
      
      // Otherwise redirect to dashboard
      navigate('/dashboard');
    }
  }, [groupId, navigate]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!groupId) {
        if (isMounted) setGroup(null);
        return;
      }
      try {
        const g = await getGroup(groupId);
        if (isMounted) {
          setGroup(g ?? null);
          if (g) {
            saveLastActiveGroup(groupId); // Save as last active group
          }
        }
      } catch (e) {
        console.error('Failed to load group in Checkout:', e);
        if (isMounted) setGroup(null);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [groupId, getGroup]);
  
  // Calculate winning template
  const winningTemplate = group ?
    (Object.keys(group.votes) as Array<keyof typeof group.votes>).reduce((a, b) =>
      group.votes[a] > group.votes[b] ? a : b
    ) : 'square';

  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    if (group) {
      setQuantity(group.members.length || 1);
    }
  }, [group]);

  // Update shipping quote when quantity changes
  useEffect(() => {
    if (shippingForm.zipCode && shippingForm.zipCode.length === 6) {
      updateShippingQuote(shippingForm.zipCode, quantity);
    }
  }, [quantity]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form state
  const [shippingForm, setShippingForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    phone: ''
  });

  // Shipping quote state - single source of truth
  const [zipStatus, setZipStatus] = useState<{
    loading: boolean;
    serviceable: boolean | null; // null = unknown, true = ok, false = bad
    message: string;
  }>({
    loading: false,
    serviceable: null,
    message: ""
  });
  const [shippingCharge, setShippingCharge] = useState<number | null>(null);
  const [codAvailable, setCodAvailable] = useState(false);

  // Pricing & totals (dynamic shipping)
  const tshirtPrice = 299; // ₹299 per t-shirt
  const printPrice = 99; // ₹99 per print
  const itemTotal = (tshirtPrice + printPrice) * quantity;
  const shipping = shippingCharge ?? (itemTotal > 999 ? 0 : 99); // Use live quote or fallback
  const tax = Math.round(itemTotal * 0.5); // 5% GST
  const finalTotal = itemTotal + shipping + tax;

  // Quantity handlers
  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, quantity + change);
    setQuantity(newQuantity);
  };

  const handleInputChange = (field: string, value: string) => {
    setShippingForm(prev => ({ ...prev, [field]: value }));
  };

  // Update shipping quote - single source of truth
  const updateShippingQuote = async (pincode: string, qty: number) => {
    // Clear state when ZIP is less than 6 digits
    if (pincode.length < 6) {
      setZipStatus({ loading: false, serviceable: null, message: "" });
      setShippingCharge(null);
      setCodAvailable(false);
      return;
    }

    // Only check if pincode is 6 digits
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      return;
    }

    setZipStatus({ loading: true, serviceable: null, message: "" });

    try {
      // Calculate weight (assume ~200g per t-shirt)
      const weightGrams = 200 * qty;

      const response = await fetch('/api/shipping-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destPincode: pincode,
          weightGrams: weightGrams,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend error
        setZipStatus({
          loading: false,
          serviceable: false,
          message: data.message || 'Unable to validate pincode'
        });
        setShippingCharge(0);
        setCodAvailable(false);
        toast.error(data.message || 'Could not validate pincode');
        return;
      }

      if (data.serviceable === false) {
        // Real not-serviceable case
        setZipStatus({
          loading: false,
          serviceable: false,
          message: data.message || 'Pincode not serviceable'
        });
        setShippingCharge(0);
        setCodAvailable(false);
        toast.error(data.message || 'Cannot deliver to this pincode');
        return;
      }

      // serviceable === true
      setZipStatus({
        loading: false,
        serviceable: true,
        message: ""
      });
      setShippingCharge(data.shipping_charge || 0);
      setCodAvailable(data.cod_available === true);

      // Autofill city/state from response
      if (data.city) {
        setShippingForm(prev => ({ ...prev, city: data.city }));
      }

      toast.success(`Shipping available! Rate: ₹${data.shipping_charge}`);
    } catch (error) {
      console.error('Shipping quote error:', error);
      setZipStatus({
        loading: false,
        serviceable: false,
        message: 'Network error'
      });
      setShippingCharge(0);
      setCodAvailable(false);
      toast.error('Could not check shipping. Please try again.');
    }
  };

  // Handle pincode input change
  const handlePincodeChange = (zipCode: string) => {
    handleInputChange('zipCode', zipCode);
  };

  // Handle pincode blur - validate on blur
  const handlePincodeBlur = () => {
    updateShippingQuote(shippingForm.zipCode, quantity);
  };

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

  const handleRazorpayPayment = async () => {
    if (!group) return;
    setIsProcessing(true);

    try {
      const ok = await loadRazorpayScript();
      if (!ok) throw new Error('Failed to load Razorpay');

      // 1) Create a Razorpay order (amount in paise)
      const amountPaise = finalTotal * 100;
      const rpOrder = await paymentsApi.createOrder(amountPaise, `grp_${group.id}`);

      // 2) Get public key
      const { keyId } = await paymentsApi.getKey();

      // 3) Open Razorpay Checkout
      const options: any = {
        key: keyId,
        amount: rpOrder.amount,
        currency: 'INR',
        name: group.name,
        description: `${group.name} • ${group.yearOfPassing}`,
        order_id: rpOrder.id,
        prefill: {
          name: `${shippingForm.firstName} ${shippingForm.lastName}`.trim(),
          email: shippingForm.email,
          contact: shippingForm.phone,
        },
        notes: { groupId: group.id },
        handler: async (response: any) => {
          try {
            // 4) Verify payment signature on backend and send email confirmation
            const verify = await paymentsApi.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              clientOrderId: `ORD-${Date.now()}`,
              email: shippingForm.email,
              name: `${shippingForm.firstName} ${shippingForm.lastName}`.trim(),
              amount: finalTotal * 100,
            });
            if (!verify.valid) throw new Error('Payment verification failed');

            // 5) Create app Order after successful payment
            const members: AdminMember[] = group.members.map(m => ({
              id: m.id,
              name: m.name,
              memberRollNumber: m.memberRollNumber,
              photo: m.photo,
              vote: m.vote,
              joinedAt: m.joinedAt.toISOString(),
              size: m.size,
              phone: m.phone,
            }));
            const newOrder: Order = {
              id: `ORD-${Date.now()}`,
              status: 'new',
              paid: true,
              paymentId: response.razorpay_payment_id,
              paidAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              description: `${group.name} • ${group.yearOfPassing}`,
              gridTemplate: winningTemplate as Order['gridTemplate'],
              members,
              shipping: {
                name: `${shippingForm.firstName} ${shippingForm.lastName}`.trim(),
                phone: shippingForm.phone,
                email: shippingForm.email,
                line1: shippingForm.address,
                line2: '',
                city: shippingForm.city,
                state: '',
                postalCode: shippingForm.zipCode,
                country: 'India',
              },
              settings: {
                widthPx: 2550,
                heightPx: 3300,
                keepAspect: true,
                gapPx: 4,
                cellScale: 1.0,
                dpi: 300,
              },
            };

            await ordersApi.createOrder(newOrder);
            setShowSuccess(true);
            setTimeout(() => { setShowSuccess(false); navigate('/'); }, 3200);
          } catch (err) {
            console.error('Payment finalize error:', err);
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        },
        theme: { color: '#6d28d9' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Razorpay error:', err);
      setIsProcessing(false);
    }
  };

  // Check if all form fields are filled
  const allFieldsFilled = Object.values(shippingForm).every(value => value.trim() !== '');
  
  // For serviceability: only block if we've checked AND it's not serviceable
  // Allow form submission if ZIP is empty, being validated, or validated as serviceable
  const isZipValid = !shippingForm.zipCode || // ZIP not entered yet
                     zipStatus.serviceable === true || // ZIP validated and serviceable
                     zipStatus.serviceable === null; // ZIP validation pending
  
  const isFormValid = allFieldsFilled && isZipValid;

  // Guard: missing groupId in route
  if (!groupId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg border-0">
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-gray-700 font-medium">Invalid checkout link: missing group id.</p>
              <Button onClick={() => navigate('/dashboard')} className="bg-purple-600 hover:bg-purple-700">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Guard: group not found for provided id
  if (groupId && !group) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <AnimatedBackground />
        <Card className="max-w-md w-full shadow-lg border-0 backdrop-blur-lg bg-white/80">
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-gray-700 font-medium">We couldn't find a group for ID: <span className="font-semibold">{groupId}</span></p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => navigate('/dashboard')}>Dashboard</Button>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => navigate(-1)}>Go Back</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 text-center shadow-lg border-0">
          <CardContent className="pt-8 pb-6">
            <div className="mb-6">
             <div className="mx-auto mb-4 bg-white rounded-full flex items-center justify-center"> 
              <img src="/congrats.gif" alt="success" width={400} />
             </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-700">Order ID: #RZP{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
              <p className="text-lg font-semibold text-green-800">₹{finalTotal}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Background doodle component
const BackgroundDoodle = () => (
  <div className="absolute inset-0 -z-10">
    <div 
      className="absolute inset-0 bg-[url('/images/background-doodle-image.png')] bg-repeat opacity-[0.5]"
      style={{ backgroundSize: '400px' }}
    />
    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-yellow-50/50 backdrop-blur-[1px]" />
  </div>
);

return (
    <div className="min-h-screen relative">
      <BackgroundDoodle />
      {/* Navigation Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate(group ? `/editor/${group.id}` : '/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Editor
            </Button>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-gray-900">Checkout</span>
            </div>
            <div className="w-[100px]" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="order-2 lg:order-1">
            <Card className="shadow-lg border-0 backdrop-blur-lg bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                  <Users className="h-5 w-5 text-purple-600" /> Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {group && (
                  <div className="bg-white/60 rounded-lg p-4 space-y-2 border border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span>Group Name:</span>
                      <span className="font-medium">{group.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Members:</span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">{group.members.length} members</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Template:</span>
                      <span className="font-medium capitalize">{winningTemplate}</span>
                    </div>
                  </div>
                )}

                {/* Item Breakdown */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">T-Shirt (each)</span>
                    <span className="font-semibold">₹{tshirtPrice}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Print Cost (each)</span>
                    <span className="font-semibold">₹{printPrice}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Quantity</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 text-center h-8"
                        min="1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal ({quantity} items)</span>
                    <span>₹{itemTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (5%)</span>
                    <span>₹{tax}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{finalTotal}</span>
                </div>

                {shipping === 0 && (
                  <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg">
                    🎉 You're eligible for free shipping!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Shipping Form & Payment */}
          <div className="order-1 lg:order-2 space-y-6">
            {/* Shipping Information */}
            <Card className="shadow-lg border-0 backdrop-blur-lg bg-white/80">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input 
                      id="firstName" 
                      value={shippingForm.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input 
                      id="lastName" 
                      value={shippingForm.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required 
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={shippingForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@example.com"
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={shippingForm.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input 
                    id="address" 
                    value={shippingForm.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main Street, Apartment 4B"
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input 
                      id="city" 
                      value={shippingForm.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <div className="relative">
                      <Input 
                        id="zipCode" 
                        value={shippingForm.zipCode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        onBlur={handlePincodeBlur}
                        placeholder="110001"
                        maxLength={6}
                        required 
                        className={zipStatus.serviceable === false ? 'border-red-500' : ''}
                      />
                      {zipStatus.loading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                        </div>
                      )}
                      {zipStatus.serviceable === true && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <MapPin className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                    </div>
                    {zipStatus.loading && (
                      <p className="mt-1 text-xs text-gray-500">
                        Checking serviceability...
                      </p>
                    )}
                    {zipStatus.serviceable === true && (
                      <p className="mt-1 text-xs text-green-600">
                        ✓ Shipping: ₹{shippingCharge}
                        {!codAvailable && ' • COD not available'}
                      </p>
                    )}
                    {zipStatus.serviceable === false && (
                      <p className="mt-1 text-xs text-red-600">
                        {zipStatus.message || 'Cannot deliver to this pincode'}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Section */}
            <Card className="fixed bottom-0 inset-x-0 z-50 sm:static shadow-lg border-0 backdrop-blur-lg bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                  <CreditCard className="h-5 w-5 text-purple-600" /> Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleRazorpayPayment}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg font-semibold shadow"
                  disabled={isProcessing || !isFormValid}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <div className="mr-2 font-bold text-lg">₹</div>
                      Pay ₹{finalTotal} with Razorpay
                    </>
                  )}
                </Button>
                
                {!isFormValid && (
                  <p className="text-sm text-red-600 mt-2 text-center">
                    {zipStatus.serviceable === false
                      ? 'Please enter a valid serviceable pincode'
                      : 'Please fill in all required fields'}
                  </p>
                )}
                
                <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Secured by Razorpay
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;