import express from 'express';
import { protect, isAdmin, isLeader } from '../middleware/authMiddleware.js';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  exportOrdersCsv,
  deleteOrder,
} from '../controllers/orderController.js';

const router = express.Router();

// Create order (leaders only)
router.post('/', protect, isLeader, createOrder);

// Admin endpoints
router.get('/', protect, isAdmin, getOrders);
router.get('/export', protect, isAdmin, exportOrdersCsv);
router.get('/:id', protect, isAdmin, getOrderById);
router.put('/:id', protect, isAdmin, updateOrder);
router.delete('/:id', protect, isAdmin, deleteOrder);

export default router;


