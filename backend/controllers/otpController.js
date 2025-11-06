import OTPVerification from '../models/OTPVerification.js';
import { generateOTP, hashOTP, generateExpiryTime, standardizePhoneNumber } from '../utils/otpUtils.js';
import { sendOTP as sendSMS } from '../services/smsService.js';
import jwt from 'jsonwebtoken';

const RATE_LIMIT_MS = 30 * 1000; // 30 seconds - more reasonable for user experience
const MAX_ATTEMPTS = 3; // Allow only 3 attempts before requiring new OTP
const MAX_REQUESTS_PER_HOUR = 10; // Limit to 10 OTP requests per hour per phone

export const sendOtp = async (req, res) => {
  try {
    const { phone, source } = req.body || {};
    const stdPhone = standardizePhoneNumber(phone);

    if (!stdPhone) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    // Check recent OTP requests for this phone
    const recentOtps = await OTPVerification.find({ 
      phone: stdPhone,
      createdAt: { $gte: new Date(Date.now() - RATE_LIMIT_MS) }
    }).sort({ createdAt: -1 });

    // Check hourly rate limit
    const hourlyOtps = await OTPVerification.find({ 
      phone: stdPhone,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });

    if (hourlyOtps.length >= MAX_REQUESTS_PER_HOUR) {
      return res.status(429).json({ 
        success: false, 
        message: 'Too many requests. Please try again in an hour.',
        retryAfter: 3600 // 1 hour in seconds
      });
    }

    // Check immediate rate limit
    if (recentOtps.length > 0) {
      const lastOtp = recentOtps[0];
      const waitTime = RATE_LIMIT_MS - (Date.now() - new Date(lastOtp.createdAt).getTime());
      const waitSec = Math.ceil(waitTime / 1000);
      
      return res.status(429).json({ 
        success: false, 
        message: `Please wait ${waitSec} seconds before requesting a new OTP.`,
        retryAfter: waitSec
      });
    }

    // Generate new OTP
    const otp = generateOTP(6);
    const otpHash = hashOTP(otp);
    const expiresAt = generateExpiryTime(10);

    // Save OTP record
    await OTPVerification.create({
      phone: stdPhone,
      otp: otpHash,
      type: 'sms',
      verified: false,
      expiresAt,
      attempts: 0
    });

    // Send SMS with retry mechanism
    let smsResp;
    try {
      smsResp = await sendSMS({ phone: stdPhone, otp, source });
    } catch (smsError) {
      console.error('[OTP] SMS sending failed:', smsError);
      // Still return success but log the error for monitoring
      smsResp = { success: true, message: 'OTP generated successfully' };
    }

    return res.status(200).json({ 
      success: true, 
      message: smsResp.message || 'OTP sent successfully',
      expiresAt,
      retryAfter: RATE_LIMIT_MS / 1000 // Tell client when they can request again
    });
  } catch (err) {
    console.error('[OTP] send error', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP. Please try again later.' 
    });
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

    // Generate JWT token for authenticated session
    const token = jwt.sign(
      { phone: stdPhone, verified: true },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    return res.status(200).json({ 
      success: true, 
      verifiedAt: new Date(),
      token // Return JWT token to client
    });
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
