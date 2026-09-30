const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { logAudit } = require('../services/auditService');

// Login with Account Lockout (SQR6: lock after 5 consecutive failed attempts)
async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.isLocked) {
      if (user.lockUntil && user.lockUntil > new Date()) {
        const remainingMinutes = Math.ceil((user.lockUntil - new Date()) / (1000 * 60));
        return res.status(403).json({
          success: false,
          error: `Account locked due to 5 consecutive failed login attempts. Try again in ${remainingMinutes} minutes or contact system administrator (SQR6).`
        });
      } else {
        // Lock expired, reset
        user.isLocked = false;
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();
      }
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.isLocked = true;
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lockout
        await user.save();
        await logAudit({
          actionType: 'USER_LOCKOUT',
          user,
          details: { reason: '5 consecutive failed password attempts' },
          ipAddress: req.ip
        });
        return res.status(403).json({
          success: false,
          error: 'Security Alert: Account has been locked for 15 minutes due to 5 consecutive failed attempts (SQR6).'
        });
      }
      await user.save();
      return res.status(401).json({
        success: false,
        error: `Invalid credentials. (${5 - user.failedLoginAttempts} attempts remaining before account lockout)`
      });
    }

    // Success - reset failed attempts
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockUntil = null;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    await logAudit({
      actionType: 'USER_LOGIN',
      user,
      details: { role: user.role, terminalSessionStart: new Date() },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        licenseNumber: user.licenseNumber,
        email: user.email
      }
    });
  } catch (err) {
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const { username, email, password, fullName, role, licenseNumber, pinCode } = req.body;
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Username or email already exists' });
    }

    const user = new User({
      username,
      email,
      password,
      fullName,
      role: role || 'Pharmacist',
      licenseNumber: licenseNumber || '',
      pinCode: pinCode || '1234'
    });
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        licenseNumber: user.licenseNumber
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res) {
  res.json({ success: true, user: req.user });
}

// Quick PIN verification endpoint for Pharmacist Overrides
async function verifyPin(req, res) {
  const { pin } = req.body;
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const valid = req.user.verifyPin(pin);
  if (!valid) {
    return res.status(400).json({ success: false, error: 'Incorrect credential PIN' });
  }

  res.json({ success: true, message: 'PIN verified' });
}

module.exports = { login, register, getMe, verifyPin };
