# Payment & Authentication API Endpoints

## OTP Authentication

### Send OTP
```http
POST /api/otp/send
Content-Type: application/json

{
  "phone": "+919876543210",
  "source": "joinGroup"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresAt": "2024-01-01T12:10:00.000Z",
  "retryAfter": 30
}
```

### Verify OTP
```http
POST /api/otp/verify
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "verifiedAt": "2024-01-01T12:05:00.000Z",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Token Structure:**
```json
{
  "phone": "+919876543210",
  "verified": true,
  "iat": 1234567890,
  "exp": 1234571490
}
```

## Payment Endpoints

### Get Join Amount (Public)
```http
GET /api/payments/join-amount
```

**Response:**
```json
{
  "tshirtPrice": 299,
  "printPrice": 99,
  "total": 398,
  "amountInPaise": 39800,
  "currency": "INR"
}
```

### Create Razorpay Order for Join
```http
POST /api/payments/join/order
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "amount": 39800,
  "currency": "INR",
  "receipt": "join_groupId_timestamp",
  "notes": {
    "groupId": "group123",
    "phone": "+919876543210"
  }
}
```

**Response:**
```json
{
  "id": "order_Abc123xyz",
  "amount": 39800,
  "currency": "INR",
  "receipt": "join_groupId_timestamp",
  "status": "created"
}
```

### Verify Payment and Join Group
```http
POST /api/payments/join/verify
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "razorpay_order_id": "order_Abc123xyz",
  "razorpay_payment_id": "pay_Xyz789abc",
  "razorpay_signature": "signature_hash",
  "groupId": "group123",
  "memberData": {
    "name": "John Doe",
    "email": "john@example.com",
    "memberRollNumber": "2024001",
    "photo": "https://cloudinary.com/...",
    "vote": "square",
    "size": "m",
    "phone": "+919876543210"
  }
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "groupId": "group123",
  "member": {
    "name": "John Doe",
    "email": "john@example.com",
    "memberRollNumber": "2024001",
    "photo": "https://cloudinary.com/...",
    "vote": "square",
    "size": "m",
    "phone": "+919876543210",
    "joinedAt": "2024-01-01T12:05:00.000Z",
    "paymentId": "pay_Xyz789abc",
    "paidAmount": 398
  },
  "message": "Payment verified and successfully joined group"
}
```

### Get Razorpay Key (Requires JWT)
```http
GET /api/payments/key
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "keyId": "rzp_live_xxxxx"
}
```

## Error Responses

### 401 Unauthorized (Invalid/Expired JWT)
```json
{
  "success": false,
  "message": "Token expired. Please verify your phone number again."
}
```

### 400 Bad Request (Payment Verification Failed)
```json
{
  "success": false,
  "valid": false,
  "message": "Invalid payment signature"
}
```

### 400 Bad Request (Group Full)
```json
{
  "success": false,
  "message": "Group is already full"
}
```

### 400 Bad Request (Duplicate Member)
```json
{
  "success": false,
  "message": "Member with this roll number already exists"
}
```

### 429 Too Many Requests (OTP Rate Limit)
```json
{
  "success": false,
  "message": "Please wait 25 seconds before requesting a new OTP.",
  "retryAfter": 25
}
```

## Frontend Integration Example

```typescript
// 1. Verify OTP and get token
const otpResponse = await fetch('/api/otp/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone, otp })
});
const { token } = await otpResponse.json();
sessionStorage.setItem('otp_auth_token', token);

// 2. Create Razorpay order
const orderResponse = await fetch('/api/payments/join/order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    amount: 39800,
    currency: 'INR',
    receipt: `join_${groupId}_${Date.now()}`,
    notes: { groupId, phone }
  })
});
const razorpayOrder = await orderResponse.json();

// 3. Open Razorpay checkout
const options = {
  key: razorpayKeyId,
  amount: razorpayOrder.amount,
  currency: 'INR',
  name: 'Signature Day',
  order_id: razorpayOrder.id,
  handler: async (response) => {
    // 4. Verify payment and join group
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
        memberData: {
          name, email, memberRollNumber, photo, vote, size, phone
        }
      })
    });
    const result = await verifyResponse.json();
    if (result.success) {
      // Successfully joined!
    }
  }
};
const rzp = new Razorpay(options);
rzp.open();
```

## Testing with Razorpay Test Mode

Use these test credentials:
- **Test Card**: 4111 1111 1111 1111
- **CVV**: Any 3 digits
- **Expiry**: Any future date

Test phone numbers for OTP:
- Use your actual phone number in development
- Configure SMS service accordingly

## Rate Limits

- **OTP Requests**: 10 per hour per phone number
- **OTP Resend**: 30 seconds cooldown
- **Payment Attempts**: No backend limit (handled by Razorpay)

## Security Notes

1. **JWT Token**: Expires in 1 hour, store in sessionStorage
2. **Payment Signature**: Always verified on backend
3. **Phone Verification**: Required before payment
4. **HTTPS Only**: Use HTTPS in production for token security
5. **CORS**: Configure allowed origins in backend




