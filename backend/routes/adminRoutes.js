import express from 'express';
import { protect, isAdmin } from '../middleware/authMiddleware.js';
import { getAdminStats, markPayoutPaid } from '../controllers/adminController.js';

const router = express.Router();

router.get('/stats', protect, isAdmin, getAdminStats);
// New canonical route for manual payouts
router.post('/rewards/:rewardId/pay', protect, isAdmin, markPayoutPaid);
// Backwards-compatible legacy route
router.post('/payouts/:rewardId/mark-paid', protect, isAdmin, markPayoutPaid);

export default router;
