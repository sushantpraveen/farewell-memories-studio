import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT token from OTP authentication
 * Extracts phone number from token and attaches to req.otpAuth
 */
export const verifyOtpToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided. Please verify your phone number.' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production'
    );

    if (!decoded.phone || !decoded.verified) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. Please verify your phone number again.' 
      });
    }

    // Attach phone info to request
    req.otpAuth = {
      phone: decoded.phone,
      verified: decoded.verified
    };

    next();
  } catch (error) {
    console.error('[OTP Auth] Token verification failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please verify your phone number again.' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token. Please verify your phone number again.' 
    });
  }
};

/**
 * Optional middleware - only verify token if present
 */
export const verifyOtpTokenOptional = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without auth
      req.otpAuth = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production'
    );

    req.otpAuth = {
      phone: decoded.phone,
      verified: decoded.verified
    };

    next();
  } catch (error) {
    // Token is invalid but don't block the request
    req.otpAuth = null;
    next();
  }
};


