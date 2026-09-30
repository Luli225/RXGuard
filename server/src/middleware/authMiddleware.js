const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'rxguard_secret_clinical_key_2026';

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or malformed Bearer token'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'User session expired or invalid' });
    }

    if (user.isLocked) {
      return res.status(403).json({ success: false, error: 'Account is locked due to security policy' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session token',
      details: err.message
    });
  }
}

// Optional auth that still attaches mock user if none provided (helpful for demo or API testing)
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) req.user = user;
    }
  } catch (e) {
    // Ignore optional auth error
  }
  next();
}

module.exports = { authenticate, optionalAuth, JWT_SECRET };
