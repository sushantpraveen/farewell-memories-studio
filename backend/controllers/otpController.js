import OTPVerification from '../models/OTPVerification.js';
import { generateOTP, hashOTP, generateExpiryTime, standardizePhoneNumber } from '../utils/otpUtils.js';
import { sendOTP as sendSMS } from '../services/smsService.js';

const RATE_LIMIT_MS = 2 * 60 * 1000; // 2 minutes
const MAX_ATTEMPTS = 5;

export const sendOtp = async (req, res) => {
  try {
    const { phone, source } = req.body || {};
    const stdPhone = standardizePhoneNumber(phone);

    if (!stdPhone) {
      return res.status(400).json({ success: false, message: 'Invalid phone' });
    }

    // Rate limit: find most recent record for this phone
    const lastOtp = await OTPVerification.findOne({ phone: stdPhone }).sort({ createdAt: -1 });
    if (lastOtp && Date.now() - new Date(lastOtp.createdAt).getTime() < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - (Date.now() - new Date(lastOtp.createdAt).getTime())) / 1000);
      return res.status(429).json({ success: false, message: `Please wait ${waitSec}s before requesting a new code.` });
    }

    const otp = generateOTP(6);
    const otpHash = hashOTP(otp);
    const expiresAt = generateExpiryTime(10);

    await OTPVerification.create({
      phone: stdPhone,
      otp: otpHash,
      type: 'sms',
      verified: false,
      expiresAt,
      attempts: 0
    });

    const smsResp = await sendSMS({ phone: stdPhone, otp, source });

    return res.status(200).json({ success: true, message: smsResp.message || 'OTP sent', expiresAt });
  } catch (err) {
    console.error('[OTP] send error', err);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body || {};
    const stdPhone = standardizePhoneNumber(phone);

    if (!stdPhone || !otp) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    const record = await OTPVerification.findOne({ phone: stdPhone }).sort({ createdAt: -1 });
    if (!record) {
      return res.status(400).json({ success: false, message: 'No OTP found for this phone' });
    }

    if (record.verified) {
      return res.status(200).json({ success: true, verifiedAt: new Date() });
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ success: false, message: 'Too many attempts. Please request a new OTP.' });
    }

    const submittedHash = hashOTP(otp);
    const isMatch = submittedHash === record.otp;

    if (!isMatch) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ success: false, message: 'Incorrect OTP' });
    }

    record.verified = true;
    await record.save();

    return res.status(200).json({ success: true, verifiedAt: new Date() });
  } catch (err) {
    console.error('[OTP] verify error', err);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};

export const statusByPhone = async (req, res) => {
  try {
    const raw = req.params.phone;
    const stdPhone = standardizePhoneNumber(raw);
    const record = await OTPVerification.findOne({ phone: stdPhone }).sort({ createdAt: -1 });
    if (!record) return res.status(404).json({ success: false, verified: false });
    return res.status(200).json({ success: true, verified: !!record.verified, createdAt: record.createdAt, expiresAt: record.expiresAt });
  } catch (err) {
    console.error('[OTP] status error', err);
    return res.status(500).json({ success: false });
  }
};
