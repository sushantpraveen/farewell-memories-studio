import React, { useEffect, useMemo, useState } from 'react';
import { sendOtp, verifyOtp } from '@/lib/otpClient';

interface Props {
  value: string;
  onChange: (val: string) => void;
  onVerified: (standardizedPhone: string) => void;
  source: 'joinGroup' | 'createGroup';
}

// Simple +91 standardization to mirror backend behaviour
const normalizePhone = (raw: string) => {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return raw.startsWith('+') ? raw : `+${digits}`;
};

export const PhoneOtpBlock: React.FC<Props> = ({ value, onChange, onVerified, source }) => {
  const [otp, setOtp] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0); // seconds
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const disabled = success;
  const normalizedPhone = useMemo(() => normalizePhone(value), [value]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleSend = async () => {
    setError(null);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      setError('Enter a valid phone number');
      return;
    }
    try {
      setIsSending(true);
      const resp = await sendOtp(normalizedPhone, source);
      if (resp.ok) {
        setCountdown(60);
      } else {
        const data = await resp.json().catch(() => ({} as any));
        setError(data?.message || 'Failed to send code');
      }
    } catch (e) {
      setError('Failed to send code');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    if (!otp || otp.length !== 6) {
      setError('Enter 6-digit code');
      return;
    }
    try {
      setIsVerifying(true);
      const resp = await verifyOtp(normalizedPhone, otp);
      if (resp.ok) {
        setSuccess(true);
        onVerified(normalizedPhone);
      } else {
        const data = await resp.json().catch(() => ({} as any));
        setError(data?.message || 'Invalid code');
      }
    } catch (e) {
      setError('Invalid code');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Mobile Number</label>
        <div className="flex items-center gap-2">
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="9876543210"
          className={`w-full px-3 py-2 rounded-md border ${error ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-200`}
        />
         <button
          type="button"
          onClick={handleSend}
          disabled={disabled || isSending || countdown > 0}
          className={`px-3 py-2 rounded-md text-white text-sm ${disabled || isSending || countdown > 0 ? 'bg-gray-300' : 'bg-purple-600 hover:bg-purple-700'} transition`}
        >
          {countdown > 0 ? `Resend in ${countdown}s` : 'Send'}
        </button>
        </div>
        {/* <p className="text-xs text-gray-500">+91 added automatically</p> */}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0,6))}
          disabled={disabled}
          placeholder="Enter 6-digit OTP"
          className={`flex-1 px-3 py-2 rounded-md border ${error ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-200`}
        />
        <button
          type="button"
          onClick={handleVerify}
          disabled={disabled || isVerifying}
          className={`px-3 py-2 rounded-md text-white text-sm ${disabled || isVerifying ? 'bg-gray-300' : 'bg-pink-600 hover:bg-pink-700'} transition`}
        >
          Verify
        </button>
      </div>

      {success && (
        <div className="text-xs inline-flex items-center gap-1 text-green-600">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Verified
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

export default PhoneOtpBlock;
