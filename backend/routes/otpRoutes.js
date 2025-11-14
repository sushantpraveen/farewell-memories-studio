import express from 'express';
import { sendOtp, verifyOtp, statusByPhone } from '../controllers/otpController.js';

const router = express.Router();

router.post('/send', sendOtp);
router.post('/verify', verifyOtp);
router.get('/status/:phone', statusByPhone);

export default router;






