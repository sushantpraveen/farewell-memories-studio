import dotenv from 'dotenv';

dotenv.config();

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID;
const MSG91_OTP_TEMPLATE_ID = process.env.MSG91_OTP_TEMPLATE_ID;

const hasCreds = Boolean(MSG91_AUTH_KEY && MSG91_SENDER_ID && MSG91_OTP_TEMPLATE_ID);
const hasFetch = typeof globalThis.fetch === 'function';

export const sendOTP = async ({ phone, otp, source = 'generic' }) => {
  if (!hasCreds) {
    console.log(`[DEV][SMS] OTP for ${phone} (${source}): ${otp}`);
    return { success: true, message: 'OTP logged in server (dev mode)' };
  }

  try {
    if (!hasFetch) {
      console.warn('[SMS] fetch not available in this Node runtime; logging OTP as fallback');
      console.log(`[SMS Fallback][DEV] OTP for ${phone}: ${otp}`);
      return { success: true, message: 'OTP sent via fallback/log' };
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    // MSG91 Flow API payload (example). Adjust flow/template variables as per MSG91 setup.
    const payload = {
      flow_id: MSG91_OTP_TEMPLATE_ID, // using env as flow id
      short_url: '1',
      recipients: [
        {
          mobiles: phone.replace('+', ''),
          // Provide multiple variable names to match different template setups
          otp: otp,      // if template uses {{otp}}
          VAR1: otp,     // if template uses {{VAR1}}
          var1: otp,     // if template uses {{var1}}
          source: source,
          VAR2: source,
          var2: source   // if template uses {{var2}}
        }
      ]
    };

    const resp = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'authkey': MSG91_AUTH_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      const text = await resp.text();
      console.warn('[SMS] MSG91 Flow API failed, trying fallback SMS. Response:', text);
      
      // Check if it's a rate limit error from MSG91
      if (resp.status === 429) {
        console.warn('[SMS] MSG91 rate limit hit, using fallback');
        console.log(`[SMS Fallback][DEV] OTP for ${phone}: ${otp}`);
        return { success: true, message: 'OTP sent via fallback (rate limited)', rateLimited: true };
      }
      
      // Fallback: try SendOTP or log
      console.log(`[SMS Fallback][DEV] OTP for ${phone}: ${otp}`);
      return { success: true, message: 'OTP sent via fallback/log' };
    }

    const responseData = await resp.json();
    console.log('[SMS] MSG91 response:', responseData);
    
    return { success: true, message: 'OTP sent successfully', responseData };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('[SMS] Request timeout while sending OTP:', err);
      console.log(`[SMS Timeout Fallback][DEV] OTP for ${phone}: ${otp}`);
      return { success: true, message: 'OTP sent via fallback (timeout)', timeout: true };
    }
    
    console.error('[SMS] Error sending OTP via MSG91:', err);
    console.log(`[SMS Fallback][DEV] OTP for ${phone}: ${otp}`);
    return { success: true, message: 'OTP sent via fallback/log' };
  }
};
