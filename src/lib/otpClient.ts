const handleResponse = async (response: Response) => {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.message || 'OTP request failed';
    throw new Error(message);
  }
  return data;
};

export const sendOtp = async (phone: string, source: string) => {
  const resp = await fetch('/api/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, source })
  });
  return handleResponse(resp);
};

export const verifyOtp = async (phone: string, otp: string) => {
  const resp = await fetch('/api/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp })
  });
  return handleResponse(resp);
};

export const getOtpStatus = async (phone: string) => {
  const resp = await fetch(`/api/otp/status/${encodeURIComponent(phone)}`);
  return handleResponse(resp);
};



