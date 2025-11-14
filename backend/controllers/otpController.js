import OTPVerification from '../models/OTPVerification.js';
import {
  generateOTP,
  hashOTP,
  generateExpiryTime,
  standardizePhoneNumber
} from '../utils/otpUtils.js';
import { sendOTP } from '../services/smsService.js';

const RATE_LIMIT_SECONDS = 30;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const VERIFIED_MAX_AGE_MINUTES = Number(process.env.OTP_VERIFIED_MAX_AGE_MINUTES || 30);

export const sendOtp = async (req, res) => {
  try {
    const { phone, source = 'generic' } = req.body || {};
    const standardized = standardizePhoneNumber(phone);
    if (!standardized) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    const recent = await OTPVerification.findOne({
      phone: standardized,
      createdAt: { $gte: new Date(Date.now() - RATE_LIMIT_SECONDS * 1000) }
    }).sort({ createdAt: -1 });

    if (recent) {
      const wait = RATE_LIMIT_SECONDS - Math.floor((Date.now() - recent.createdAt.getTime()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${wait > 0 ? wait : 1} seconds before requesting another OTP.`,
        retryAfter: wait > 0 ? wait : 1
      });
    }

    const otp = generateOTP(6);
    const expiresAt = generateExpiryTime(OTP_EXPIRY_MINUTES);

    await OTPVerification.create({
      phone: standardized,
      otpHash: hashOTP(otp),
      expiresAt,
      attempts: 0,
      verified: false
    });

    await sendOTP({ phone: standardized, otp, source });

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      expiresAt
    });
  } catch (error) {
    console.error('[OTP] send error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body || {};
    const standardized = standardizePhoneNumber(phone);
    if (!standardized || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and OTP are required' });
    }

    const record = await OTPVerification.findOne({ phone: standardized })
      .sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ success: false, message: 'No OTP found for this phone number' });
    }

    if (record.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    const incomingHash = hashOTP(otp);
    if (incomingHash !== record.otpHash) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ success: false, message: 'Incorrect OTP' });
    }

    record.verified = true;
    record.verifiedAt = new Date();
    record.attempts = 0;
    await record.save();

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      verifiedAt: record.verifiedAt
    });
  } catch (error) {
    console.error('[OTP] verify error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};

export const statusByPhone = async (req, res) => {
  try {
    const standardized = standardizePhoneNumber(req.params.phone);
    if (!standardized) {
      return res.status(400).json({ success: false, verified: false });
    }

    const record = await OTPVerification.findOne({ phone: standardized })
      .sort({ verifiedAt: -1 });

    if (!record || !record.verified) {
      return res.status(404).json({ success: false, verified: false });
    }

    if (!record.verifiedAt || (Date.now() - record.verifiedAt.getTime()) > VERIFIED_MAX_AGE_MINUTES * 60 * 1000) {
      return res.status(404).json({ success: false, verified: false });
    }

    return res.status(200).json({
      success: true,
      verified: true,
      verifiedAt: record.verifiedAt,
      usedAt: record.usedAt || null
    });
  } catch (error) {
    console.error('[OTP] status error:', error);
    return res.status(500).json({ success: false });
  }
};






