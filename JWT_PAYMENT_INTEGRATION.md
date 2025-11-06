# JWT Authentication & Razorpay Payment Integration for JoinGroup

This document explains the JWT authentication with OTP and Razorpay payment gateway integration for the JoinGroup flow.

## Overview

The join group flow now requires:
1. **Phone OTP Verification** - Users must verify their phone number
2. **JWT Authentication** - A JWT token is issued after OTP verification
3. **Payment via Razorpay** - Users must pay ₹398 to join a group
4. **Payment Verification** - Backend validates payment before adding member to group

## Architecture

### Backend Components

#### 1. OTP Controller (`backend/controllers/otpController.js`)
- `sendOtp`: Sends OTP to phone number with rate limiting
- `verifyOtp`: Verifies OTP and **generates JWT token** containing phone number
- JWT tokens expire in 1 hour

#### 2. JWT Middleware (`backend/middleware/otpAuthMiddleware.js`)
- `verifyOtpToken`: Required middleware that validates JWT token
- `verifyOtpTokenOptional`: Optional middleware for endpoints that work with or without auth
- Extracts phone number from token and attaches to `req.otpAuth`

#### 3. Payment Controller (`backend/controllers/paymentController.js`)
New endpoints added:
- `calculateJoinAmount`: Returns pricing (₹398 = ₹299 t-shirt + ₹99 print)
- `verifyPaymentAndJoin`: 
  - Verifies Razorpay payment signature
  - Adds member to group
  - Stores payment ID and amount with member data
  - Sends welcome email

#### 4. Payment Routes (`backend/routes/paymentRoutes.js`)
New routes:
```javascript
GET  /api/payments/join-amount       // Public - Get pricing
POST /api/payments/join/order        // Create Razorpay order (requires JWT)
POST /api/payments/join/verify       // Verify payment & join group (optional JWT)
```

### Frontend Components

#### 1. PhoneOtpBlock (`src/components/otp/PhoneOtpBlock.tsx`)
- Updated to receive and store JWT token from OTP verification
- Stores token in `sessionStorage` as `otp_auth_token`
- Passes token to parent component via `onVerified(phone, token)` callback

#### 2. useJoinGroup Hook (`src/hooks/useJoinGroup.ts`)
Completely rewritten `handleSubmit` function:

**Flow:**
1. Validate form data
2. Check phone verification
3. Load Razorpay SDK script
4. Retrieve JWT token from state or sessionStorage
5. Create Razorpay order with JWT authentication
6. Open Razorpay checkout modal
7. On payment success:
   - Verify payment signature on backend
   - Backend adds member to group
   - Update user context
   - Navigate to success page

**New State:**
- `authToken`: JWT token from OTP verification
- `isProcessingPayment`: Payment processing status

#### 3. JoinGroup Page (`src/pages/JoinGroup.tsx`)
- Updated to handle token from OTP verification
- Button text changed to "💳 Pay ₹398 & Join Group"
- Shows appropriate loading states for payment processing

## Payment Flow Diagram

```
User fills form → Verifies phone via OTP → Receives JWT token
                                              ↓
                            JWT token stored in sessionStorage
                                              ↓
                    User clicks "Pay ₹398 & Join Group"
                                              ↓
                    POST /api/payments/join/order (with JWT)
                                              ↓
                          Create Razorpay order
                                              ↓
                        Open Razorpay checkout modal
                                              ↓
                    User completes payment
                                              ↓
            Razorpay calls handler with payment details
                                              ↓
           POST /api/payments/join/verify (with JWT)
                                              ↓
            Backend verifies payment signature
                                              ↓
        Member added to group with payment details
                                              ↓
                  Welcome email sent
                                              ↓
            User redirected to success page
```

## Security Features

1. **JWT Token Expiry**: Tokens expire in 1 hour
2. **Rate Limiting**: OTP sending limited to 10 requests/hour per phone
3. **Payment Signature Verification**: Razorpay HMAC signature validation
4. **Duplicate Prevention**: Check for existing roll numbers before joining
5. **Group Capacity**: Verify group isn't full before payment
6. **Phone Verification Required**: Cannot proceed without OTP verification

## Member Data Structure

Members now include payment information:
```javascript
{
  name: string,
  email: string,
  memberRollNumber: string,
  photo: string,
  vote: 'square' | 'hexagonal' | 'circle',
  size: 's' | 'm' | 'l' | 'xl' | 'xxl',
  phone: string,
  joinedAt: Date,
  paymentId: string,      // Razorpay payment ID
  paidAmount: number      // Amount paid (398)
}
```

## Environment Variables Required

```env
# Razorpay (already configured)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# JWT Secret
JWT_SECRET=your_jwt_secret_key_change_in_production

# SMS Service (for OTP - already configured)
# Your SMS service credentials
```

## Testing Flow

1. **Test OTP Verification**:
   - Enter phone number on join form
   - OTP should be sent automatically
   - Verify OTP to get JWT token
   - Check sessionStorage for `otp_auth_token`

2. **Test Payment Flow**:
   - Fill in all form fields
   - Click "Pay ₹398 & Join Group"
   - Razorpay modal should open
   - Complete test payment
   - Should be added to group and redirected to success page

3. **Test Error Handling**:
   - Try joining without OTP verification
   - Try with expired JWT token (wait 1 hour)
   - Try payment cancellation
   - Try duplicate roll number

## Key Changes Summary

### Backend
- ✅ JWT token generation in OTP verification
- ✅ JWT middleware for authentication
- ✅ Payment verification endpoint with group join logic
- ✅ Payment amount calculation endpoint
- ✅ Email confirmation on successful join

### Frontend
- ✅ JWT token storage and management
- ✅ Razorpay SDK integration
- ✅ Payment flow in join form
- ✅ Loading states for payment
- ✅ Error handling for payment failures

## Migration Notes

**Existing Groups**: Members who joined before this update won't have `paymentId` or `paidAmount` fields. The system handles this gracefully.

**Old Join Endpoint**: The original `/api/groups/:id/join` endpoint still exists but should no longer be used directly. It's kept for backward compatibility but the new flow goes through payment verification.

## Support & Troubleshooting

Common issues:

1. **JWT Token Not Found**: User needs to re-verify phone number
2. **Payment Verification Failed**: Check Razorpay webhook configuration
3. **Group Full Error**: Group capacity reached, need to increase via dashboard
4. **Duplicate Roll Number**: Member already exists in group

For all issues, check browser console and backend logs for detailed error messages.


