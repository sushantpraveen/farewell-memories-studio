import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  otp: { type: String, required: true }, // sha256 hash
  type: { type: String, enum: ['sms'], default: 'sms' },
  verified: { type: Boolean, default: false, index: true },
  expiresAt: { type: Date, required: true, index: true }, // TTL index added below
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, index: true }
});

// TTL index to cleanup expired OTPs automatically
// Note: MongoDB TTL works only on a single field index with expireAfterSeconds.
// We'll set it to 0 so it expires exactly at the datetime in `expiresAt`.
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Helpful compound index for quick lookups
OTPSchema.index({ phone: 1, createdAt: -1 });

const OTPVerification = mongoose.model('OTPVerification', OTPSchema);
export default OTPVerification;
