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
  const [otpSent, setOtpSent] = useState(false);

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
        setOtpSent(true);
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

  // Auto-send OTP when valid phone number is entered
  useEffect(() => {
    if (!otpSent && !success && normalizedPhone && normalizedPhone.length >= 13 && countdown === 0 && !isSending) {
      handleSend();
    }
  }, [normalizedPhone, otpSent, success, countdown, isSending]);

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

  // Auto-verify when 6-digit OTP is entered
  useEffect(() => {
    if (otp.length === 6 && !success && !isVerifying && otpSent) {
      handleVerify();
    }
  }, [otp, success, isVerifying, otpSent]);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Mobile Number</label>
        <div className="relative">
          <input
            type="tel"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="9876543210"
            className={`w-full px-3 py-2 rounded-md border ${error ? 'border-red-500' : success ? 'border-green-500' : 'border-gray-200'} focus:outline-none focus:ring-2 ${success ? 'focus:ring-green-200' : 'focus:ring-purple-200'}`}
          />
          {isSending && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {otpSent && !success && countdown > 0 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              {countdown}s
            </div>
          )}
        </div>
        {isSending && <p className="text-xs text-purple-600">Sending OTP...</p>}
        {otpSent && !success && <p className="text-xs text-green-600">OTP sent! Check your messages.</p>}
      </div>

      {otpSent && !success && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Enter OTP</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0,6))}
              disabled={disabled}
              placeholder="Enter 6-digit OTP"
              className={`w-full px-3 py-2 rounded-md border ${error ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-pink-200 tracking-widest text-center text-lg`}
              autoFocus
            />
            {isVerifying && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          {isVerifying && <p className="text-xs text-pink-600">Verifying...</p>}
        </div>
      )}

      {success && (
        <div className="text-sm inline-flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-md">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="font-medium">Phone Verified ✓</span>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{error}</p>
      )}
    </div>
  );
};

export default PhoneOtpBlock;
