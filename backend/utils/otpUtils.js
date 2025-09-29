import crypto from 'crypto';

export const generateOTP = (digits = 6) => {
  const max = 10 ** digits;
  const num = Math.floor(Math.random() * max);
  return num.toString().padStart(digits, '0');
};

export const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

export const generateExpiryTime = (minutes = 10) => {
  const expires = new Date(Date.now() + minutes * 60 * 1000);
  return expires;
};

export const standardizePhoneNumber = (raw) => {
  if (!raw) return '';
  // Remove non-digits
  let digits = String(raw).replace(/\D/g, '');
  // If starts with 91 and length 12 (e.g., 9198xxxxxxxx), treat as missing plus
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  // If Indian 10-digit, prefix +91
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  // If already includes country code and length between 11-15
  if (digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }
  // Fallback: return with plus if missing
  if (!raw.startsWith('+')) return `+${digits}`;
  return raw;
};
