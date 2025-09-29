export const sendOtp = async (phone: string, source: 'joinGroup'|'createGroup') => {
  return fetch('/api/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, source })
  });
};

export const verifyOtp = async (phone: string, otp: string) => {
  return fetch('/api/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp })
  });
};
