import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { verifyOtpToken, verifyOtpTokenOptional } from '../middleware/otpAuthMiddleware.js';
import { 
  getKey, 
  createRazorpayOrder, 
  verifyPayment,
  calculateJoinAmount,
  verifyPaymentAndJoin 
} from '../controllers/paymentController.js';

const router = express.Router();

// Public routes
router.get('/join-amount', calculateJoinAmount); // Get pricing
router.get('/key', getKey); // Get Razorpay public key (safe to be public)

// Checkout flow routes (requires user auth)
router.post('/order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);

// Join group flow routes (requires OTP auth)
router.post('/join/order', verifyOtpToken, createRazorpayOrder); // Create order for joining
router.post('/join/verify', verifyOtpTokenOptional, verifyPaymentAndJoin); // Verify payment and join group

export default router;


