const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendServerError } = require('../utils/errorResponse');

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      studentId: user.studentId,
      batch: user.batch
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, studentId, department, batch } = req.body;

    // Public registration is student-only unless an institution explicitly
    // enables supervisor onboarding during a controlled setup window.
    const safeRole = role === 'supervisor' && process.env.ALLOW_PUBLIC_SUPERVISOR_REGISTRATION === 'true'
      ? 'supervisor'
      : 'student';

    // Create user
    const user = await User.create({
      name,
      email: typeof email === 'string' ? email.trim().toLowerCase() : email,
      password,
      role: safeRole,
      studentId: studentId || null,
      department: department || null,
      batch: batch || null
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, error: 'An account already exists with this email. Sign in or reset your password instead.' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, error: 'This account has been deactivated' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Explicitly block admins from regular login gateway if desired, or let them in.
    // We will let them in, but they should ideally use the admin gateway.

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Admin Login
// @route   POST /api/auth/admin-login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+password');
    const isMatch = user ? await user.matchPassword(password) : false;
    if (!user || user.role !== 'admin' || user.status === 'inactive' || !isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const sendResetEmail = async ({ email, name, resetUrl }) => {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error('Password reset email is not configured. Contact the platform administrator.');
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: 'Reset your SuperVisorAI password',
      text: `Hello ${name},\n\nUse this link within one hour to reset your password:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`
    }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Unable to send the password reset email. Please try again later.');
};

// @desc Request a password-reset email
// @route POST /api/auth/forgot-password
// @access Public
exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, error: 'Please provide your email address' });
    const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');
    // Keep the response identical for unknown email addresses to avoid account enumeration.
    if (!user) return res.json({ success: true, message: 'If an account exists for this email, a reset link has been sent.' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const frontendOrigin = (process.env.FRONTEND_URL || '').split(',').map((value) => value.trim()).find(Boolean);
    if (!frontendOrigin) throw new Error('FRONTEND_URL is not configured');
    const resetUrl = `${frontendOrigin.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
    try {
      await sendResetEmail({ email: user.email, name: user.name, resetUrl });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      // Preserve the same public response for existing and non-existing
      // addresses. Operators receive the server log without leaking account
      // existence or email-provider configuration to an attacker.
      console.error('Password reset email failed:', error.message);
      return res.json({ success: true, message: 'If an account exists for this email, a reset link has been sent.' });
    }
    res.json({ success: true, message: 'If an account exists for this email, a reset link has been sent.' });
  } catch (error) {
    return sendServerError(res, error, 'Password reset is temporarily unavailable. Please try again later.');
  }
};

// @desc Set a password using a valid one-time reset token
// @route POST /api/auth/reset-password/:token
// @access Public
exports.resetPassword = async (req, res) => {
  try {
    const password = String(req.body?.password || '');
    if (password.length < 8) return res.status(422).json({ success: false, error: 'Password must be at least 8 characters long' });
    const token = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: new Date() } }).select('+password +passwordResetToken +passwordResetExpires');
    if (!user) return res.status(400).json({ success: false, error: 'This password-reset link is invalid or has expired. Request a new one.' });
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message || 'Unable to reset password' });
  }
};
