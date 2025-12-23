import express from 'express';
import {
  createAmbassador,
  getAmbassadorById,
  updateAmbassador,
  getAmbassadorStatsEndpoint,
  getAmbassadorSummary,
  getAmbassadorRewards,
  getAmbassadorGroups,
  updatePayoutMethod,
  listAmbassadors
} from '../controllers/ambassadorController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
// POST route for creating ambassadors (signup) - must be public
router.post('/', createAmbassador);
router.get('/', protect, isAdmin, listAmbassadors);
router.get('/:id', getAmbassadorById);
router.patch('/:id', updateAmbassador);
router.patch('/:id/payout-method', updatePayoutMethod);
router.get('/:id/stats', getAmbassadorStatsEndpoint);
router.get('/:id/summary', getAmbassadorSummary);
router.get('/:id/rewards', getAmbassadorRewards);
router.get('/:id/groups', getAmbassadorGroups);

export default router;
