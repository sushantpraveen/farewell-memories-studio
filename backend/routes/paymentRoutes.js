import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getKey, createRazorpayOrder, verifyPayment } from '../controllers/paymentController.js';

const router = express.Router();

router.get('/key', protect, getKey);
router.post('/order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);

export default router;


