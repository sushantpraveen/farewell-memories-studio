import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
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

// Join group flow routes (public)
router.post('/join/order', createRazorpayOrder); // Create order for joining
router.post('/join/verify', verifyPaymentAndJoin); // Verify payment and join group

export default router;


