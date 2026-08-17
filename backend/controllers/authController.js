const User = require('../models/User');
const Institution = require('../models/Institution');
const Department = require('../models/Department');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { sendServerError } = require('../utils/errorResponse');

const googleClient = new OAuth2Client();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_VERIFICATION_ATTEMPTS = 5;

const createHttpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normaliseEmail = (value) => {
  if (typeof value !== 'string') throw createHttpError('Please provide a valid email address', 422);
  const email = value.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 254) throw createHttpError('Please provide a valid email address', 422);
  return email;
};

const optionalText = (value, fieldName, maxLength) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw createHttpError(`${fieldName} must be text`, 422);
  const text = value.trim();
  if (text.length > maxLength) throw createHttpError(`${fieldName} is too long`, 422);
  return text || null;
};

const requiredName = (value) => {
  if (typeof value !== 'string') throw createHttpError('Please provide your full name', 422);
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 120) throw createHttpError('Name must be between 2 and 120 characters', 422);
  return name;
};

const requiredPassword = (value) => {
  if (typeof value !== 'string' || value.length < 8 || value.length > 256) {
    throw createHttpError('Password must be between 8 and 256 characters long', 422);
  }
  return value;
};

const passwordConfirmationMatches = (password, confirmation) => {
  if (confirmation !== undefined && password !== confirmation) {
    throw createHttpError('Passwords do not match', 422);
  }
};

const safeRole = (role) => (
  role === 'supervisor' && process.env.ALLOW_PUBLIC_SUPERVISOR_REGISTRATION === 'true'
    ? 'supervisor'
    : 'student'
);

// Temporarily defaults to off. Set this exact backend value to "true" when
// the institution is ready to require email ownership during registration.
const emailVerificationEnabled = () => process.env.EMAIL_VERIFICATION_ENABLED === 'true';

const isReadyForAuthentication = (user) => (
  user.emailVerified !== false && (!user.onboardingStatus || user.onboardingStatus === 'complete')
);

const isTestEnvironment = () => process.env.NODE_ENV === 'test';
const hashSecret = (value) => crypto.createHash('sha256').update(value).digest('hex');

const equalHashedSecret = (expected, provided) => {
  if (typeof expected !== 'string' || typeof provided !== 'string' || expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(provided, 'utf8'));
};

const parseBoundedInteger = (value, fallback, minimum, maximum) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? Math.max(minimum, Math.min(maximum, parsed)) : fallback;
};

const verificationLifetimeMs = () => parseBoundedInteger(process.env.EMAIL_VERIFICATION_EXPIRES_MINUTES, 10, 5, 30) * 60 * 1000;
const verificationCooldownMs = () => parseBoundedInteger(process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS, 60, 30, 300) * 1000;
const googleProfileLifetimeMs = () => parseBoundedInteger(process.env.GOOGLE_PROFILE_TOKEN_EXPIRES_MINUTES, 15, 5, 60) * 60 * 1000;

const createVerificationCode = () => (
  isTestEnvironment()
    ? '000000'
    : crypto.randomInt(0, 1000000).toString().padStart(6, '0')
);

const createVerificationDetails = () => {
  const code = createVerificationCode();
  return {
    code,
    codeHash: hashSecret(code),
    expires: new Date(Date.now() + verificationLifetimeMs())
  };
};

const configuredGoogleClientIds = () => [
  process.env.GOOGLE_CLIENT_ID,
  ...(process.env.GOOGLE_CLIENT_IDS || '').split(',')
].map((value) => String(value || '').trim()).filter(Boolean);

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  institution: user.institution,
  department: user.department,
  studentId: user.studentId,
  batch: user.batch
});

// Get token from model and send a deliberately small, browser-safe profile.
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });

  res.status(statusCode).json({ success: true, token, user: publicUser(user) });
};

const hasEmailConfiguration = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

const sendEmail = async ({ to, subject, text }) => {
  // Tests exercise the complete account-state flow without contacting a real
  // mail provider or exposing a verification code through HTTP.
  if (isTestEnvironment()) return;
  if (!hasEmailConfiguration()) throw createHttpError('Email delivery is not configured. Contact the platform administrator.', 503);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text }),
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) throw createHttpError('Email provider did not accept the message', 503);
};

const sendVerificationEmail = async ({ email, name, code }) => {
  await sendEmail({
    to: email,
    subject: 'Verify your SuperVisorAI email address',
    text: `Hello ${name},\n\nYour SuperVisorAI verification code is: ${code}\n\nIt expires in ${verificationLifetimeMs() / 60000} minutes. Do not share this code with anyone.\n\nIf you did not start registration, you can ignore this email.`
  });
};

const sendResetEmail = async ({ email, name, resetUrl }) => {
  await sendEmail({
    to: email,
    subject: 'Reset your SuperVisorAI password',
    text: `Hello ${name},\n\nUse this link within one hour to reset your password:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`
  });
};

const pendingEmailResponse = () => ({
  success: true,
  message: 'If a pending registration exists for this email, a verification code has been sent.'
});

const buildLocalRegistration = (body = {}) => ({
  name: requiredName(body.name),
  email: normaliseEmail(body.email),
  password: requiredPassword(body.password),
  role: safeRole(body.role),
  studentId: optionalText(body.studentId, 'Student ID', 100),
  department: optionalText(body.department, 'Department', 120),
  batch: optionalText(body.batch, 'Batch', 100),
  _institutionSlug: optionalText(body.institutionSlug, 'Institution', 120),
  _departmentId: optionalText(body.departmentId, 'Department', 80)
});

const resolveRegistrationTenant = async (registration) => {
  const tenantInput = { ...registration };
  delete tenantInput._institutionSlug;
  delete tenantInput._departmentId;
  let institution = null;
  if (registration._institutionSlug) {
    institution = await Institution.findOne({ slug: registration._institutionSlug.toLowerCase(), status: 'active' });
    if (!institution) throw createHttpError('Choose an active institution', 422);
  } else {
    const institutions = await Institution.find({ status: 'active' }).select('_id').limit(2);
    if (institutions.length > 1) throw createHttpError('Choose your institution before creating an account', 422);
    institution = institutions[0] || null;
  }
  tenantInput.institution = institution?._id || null;
  if (institution) {
    const allowedDomains = (institution.emailDomains || []).map((domain) => String(domain).toLowerCase());
    const emailDomain = String(tenantInput.email || '').split('@').pop().toLowerCase();
    if (allowedDomains.length && !allowedDomains.includes(emailDomain)) {
      throw createHttpError('Use an email address issued by the selected institution, or ask its administrator for account access', 422);
    }
    const departmentCount = await Department.countDocuments({ institution: institution._id, status: 'active' });
    if (!departmentCount) throw createHttpError('This institution has not opened registration yet because its department list is empty', 409);
    if (registration._departmentId) {
      const department = await Department.findOne({ _id: registration._departmentId, institution: institution._id, status: 'active' });
      if (!department) throw createHttpError('Choose a department managed by your institution', 422);
      tenantInput.departmentRef = department._id;
      tenantInput.department = department.name;
    } else {
      const escaped = String(registration.department || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const department = escaped ? await Department.findOne({ institution: institution._id, status: 'active', name: { $regex: `^${escaped}$`, $options: 'i' } }) : null;
      if (!department) throw createHttpError('Choose a department managed by your institution', 422);
      tenantInput.departmentRef = department._id;
      tenantInput.department = department.name;
    }
  }
  return tenantInput;
};

const setPendingVerification = (user, details) => {
  user.emailVerified = false;
  user.onboardingStatus = 'email_verification_pending';
  user.emailVerificationCode = details.codeHash;
  user.emailVerificationExpires = details.expires;
  user.emailVerificationAttempts = 0;
  user.emailVerificationLastSentAt = new Date();
};

const sendPendingRegistrationCode = async (user) => {
  const details = createVerificationDetails();
  setPendingVerification(user, details);
  await user.save();
  try {
    await sendVerificationEmail({ email: user.email, name: user.name, code: details.code });
  } catch (error) {
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    user.emailVerificationAttempts = 0;
    user.emailVerificationLastSentAt = undefined;
    await user.save({ validateBeforeSave: false });
    throw error;
  }
};

const pendingEmailFields = '+password +emailVerificationCode +emailVerificationExpires +emailVerificationAttempts +emailVerificationLastSentAt';

const registerDirectly = async (registration, res) => {
  registration = await resolveRegistrationTenant(registration);
  let user = await User.findOne({ email: registration.email }).select(pendingEmailFields);
  if (user && (user.onboardingStatus !== 'email_verification_pending' || user.emailVerified !== false)) {
    throw createHttpError('An account already exists with this email. Sign in or reset your password instead.', 409);
  }

  if (user) {
    Object.assign(user, registration);
  } else {
    user = new User(registration);
  }
  user.emailVerified = true;
  user.onboardingStatus = 'complete';
  user.emailVerificationCode = undefined;
  user.emailVerificationExpires = undefined;
  user.emailVerificationAttempts = 0;
  user.emailVerificationLastSentAt = undefined;
  await user.save();
  return sendTokenResponse(user, 201, res);
};

// @desc    Register directly or begin email verification when enabled
// @route   POST /api/auth/register/request-verification
// @access  Public
exports.requestVerification = async (req, res) => {
  let newlyCreatedUser = null;
  try {
    let registration = buildLocalRegistration(req.body);

    if (!emailVerificationEnabled()) {
      return registerDirectly(registration, res);
    }

    registration = await resolveRegistrationTenant(registration);

    let user = await User.findOne({ email: registration.email }).select(pendingEmailFields);

    if (user) {
      if (user.onboardingStatus !== 'email_verification_pending' || user.emailVerified !== false) {
        return res.status(409).json({ success: false, error: 'An account already exists with this email. Sign in or reset your password instead.' });
      }
      const lastSent = user.emailVerificationLastSentAt?.getTime() || 0;
      if (Date.now() - lastSent < verificationCooldownMs()) {
        return res.status(429).json({ success: false, error: 'Please wait before requesting another verification code.' });
      }
      Object.assign(user, registration);
    } else {
      user = new User({ ...registration, emailVerified: false, onboardingStatus: 'email_verification_pending' });
      newlyCreatedUser = user;
    }

    await sendPendingRegistrationCode(user);
    return res.status(202).json({
      success: true,
      message: 'We sent a verification code to your email address. Enter it to activate your account.'
    });
  } catch (error) {
    if (newlyCreatedUser?._id) {
      // Avoid reserving an address when creation succeeded but delivery did
      // not. The delete is restricted to the freshly created pending record.
      await User.deleteOne({ _id: newlyCreatedUser._id, onboardingStatus: 'email_verification_pending', emailVerified: false }).catch(() => {});
    }
    if (error?.statusCode) return res.status(error.statusCode).json({ success: false, error: error.message });
    if (error?.code === 11000) return res.status(409).json({ success: false, error: 'An account already exists with this email. Sign in or reset your password instead.' });
    return sendServerError(res, error, 'Unable to start email verification. Please try again later.');
  }
};

// Direct sign-up path used while email-code registration is paused. Keeping
// it separate prevents an outdated deployment variable from sending the
// current sign-up form into the dormant verification flow.
exports.register = async (req, res) => {
  try {
    return await registerDirectly(buildLocalRegistration(req.body), res);
  } catch (error) {
    if (error?.statusCode) return res.status(error.statusCode).json({ success: false, error: error.message });
    if (error?.code === 11000) return res.status(409).json({ success: false, error: 'An account already exists with this email. Sign in or reset your password instead.' });
    return sendServerError(res, error, 'Unable to create your account. Please try again later.');
  }
};

exports.getRegistrationOptions = async (req, res) => {
  try {
    const institutions = await Institution.find({ status: 'active' }).select('name slug emailDomains').sort({ name: 1 }).lean();
    const departments = await Department.find({ status: 'active', institution: { $in: institutions.map((item) => item._id) } }).select('institution code name').sort({ name: 1 }).lean();
    res.json({ success: true, data: institutions.map((institution) => ({ ...institution, departments: departments.filter((department) => String(department.institution) === String(institution._id)) })) });
  } catch (error) { return sendServerError(res, error, 'Unable to load registration options'); }
};

// @desc    Resend the current pending-registration code
// @route   POST /api/auth/register/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
  try {
    const email = normaliseEmail(req.body?.email);
    const user = await User.findOne({ email }).select(pendingEmailFields);
    // Never reveal whether an address has a pending registration.
    if (!user || user.onboardingStatus !== 'email_verification_pending' || user.emailVerified !== false) {
      return res.status(200).json(pendingEmailResponse());
    }
    const lastSent = user.emailVerificationLastSentAt?.getTime() || 0;
    if (Date.now() - lastSent < verificationCooldownMs()) {
      return res.status(429).json({ success: false, error: 'Please wait before requesting another verification code.' });
    }
    await sendPendingRegistrationCode(user);
    return res.status(200).json(pendingEmailResponse());
  } catch (error) {
    // Invalid input and mail configuration are still useful feedback to the
    // legitimate person using the form; no account state is disclosed.
    if (error?.statusCode) return res.status(error.statusCode).json({ success: false, error: error.message });
    return sendServerError(res, error, 'Unable to resend the verification code. Please try again later.');
  }
};

// @desc    Verify a registration code and activate the account
// @route   POST /api/auth/register/verify
// @access  Public
exports.verifyRegistration = async (req, res) => {
  try {
    const email = normaliseEmail(req.body?.email);
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    if (!/^\d{6}$/.test(code)) return res.status(422).json({ success: false, error: 'Enter the six-digit verification code.' });

    const user = await User.findOne({ email }).select(pendingEmailFields);
    if (!user || user.onboardingStatus !== 'email_verification_pending' || user.emailVerified !== false) {
      return res.status(400).json({ success: false, error: 'This verification code is invalid or has expired.' });
    }
    if (!user.emailVerificationExpires || user.emailVerificationExpires <= new Date()) {
      return res.status(400).json({ success: false, error: 'This verification code is invalid or has expired. Request a new code.' });
    }
    if (user.emailVerificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      return res.status(429).json({ success: false, error: 'Too many incorrect codes. Request a new verification code.' });
    }

    const validCode = equalHashedSecret(user.emailVerificationCode, hashSecret(code));
    if (!validCode) {
      user.emailVerificationAttempts += 1;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ success: false, error: 'This verification code is invalid or has expired.' });
    }

    user.emailVerified = true;
    user.onboardingStatus = 'complete';
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    user.emailVerificationAttempts = 0;
    user.emailVerificationLastSentAt = undefined;
    await user.save({ validateBeforeSave: false });
    return sendTokenResponse(user, 201, res);
  } catch (error) {
    if (error?.statusCode) return res.status(error.statusCode).json({ success: false, error: error.message });
    return sendServerError(res, error, 'Unable to verify this email address. Please try again later.');
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const email = normaliseEmail(req.body?.email);
    const password = req.body?.password;
    if (typeof password !== 'string' || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    const isMatch = user?.password ? await user.matchPassword(password) : false;
    if (!user || !isMatch) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    if (user.status === 'inactive') return res.status(403).json({ success: false, error: 'This account has been deactivated' });
    if (!emailVerificationEnabled() && user.emailVerified === false && user.onboardingStatus === 'email_verification_pending') {
      user.emailVerified = true;
      user.onboardingStatus = 'complete';
      await user.save({ validateBeforeSave: false });
    }
    if (!isReadyForAuthentication(user)) return res.status(403).json({ success: false, error: 'Verify your email address before signing in.' });

    return sendTokenResponse(user, 200, res);
  } catch (error) {
    if (error?.statusCode) return res.status(error.statusCode).json({ success: false, error: error.message });
    return sendServerError(res, error, 'Unable to sign in. Please try again later.');
  }
};

// @desc    Admin Login
// @route   POST /api/auth/admin-login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const email = normaliseEmail(req.body?.email);
    const password = req.body?.password;
    if (typeof password !== 'string' || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    const isMatch = user?.password ? await user.matchPassword(password) : false;
    if (!user || user.role !== 'admin' || user.status === 'inactive' || !isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    if (!isReadyForAuthentication(user)) return res.status(403).json({ success: false, error: 'Verify your email address before signing in.' });
    return sendTokenResponse(user, 200, res);
  } catch (error) {
    if (error?.statusCode) return res.status(error.statusCode).json({ success: false, error: error.message });
    return sendServerError(res, error, 'Unable to sign in. Please try again later.');
  }
};

// @desc    Verify a Google Identity Services ID token
// @route   POST /api/auth/google
// @access  Public
exports.googleAuthentication = async (req, res) => {
  try {
    const credential = typeof req.body?.credential === 'string' ? req.body.credential.trim() : '';
    if (!credential || credential.length > 16000) return res.status(422).json({ success: false, error: 'A valid Google credential is required.' });
    const audiences = configuredGoogleClientIds();
    if (!audiences.length) return res.status(503).json({ success: false, error: 'Google sign-in is not configured. Contact the platform administrator.' });

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: audiences });
      payload = ticket.getPayload();
    } catch (verificationError) {
      const reason = String(verificationError?.message || '');
      if (/audience|recipient/i.test(reason)) {
        return res.status(503).json({ success: false, error: 'Google sign-in is configured with a different client ID on the frontend and backend. Contact the platform administrator.' });
      }
      if (/expired|too late|used too late/i.test(reason)) {
        return res.status(401).json({ success: false, error: 'The Google sign-in response expired. Please choose your Google account again.' });
      }
      return res.status(401).json({ success: false, error: 'Google could not verify this sign-in request. Please try again.' });
    }
    if (!payload?.sub || !payload?.email || !(payload.email_verified === true || payload.email_verified === 'true')) {
      return res.status(401).json({ success: false, error: 'Your Google account must have a verified email address.' });
    }

    const email = normaliseEmail(payload.email);
    let user = await User.findOne({ googleId: payload.sub }).select('+googleId +googleProfileToken +googleProfileTokenExpires');
    if (user && user.email !== email) {
      return res.status(401).json({ success: false, error: 'Google account verification failed. Please use the original account.' });
    }
    if (!user) {
      user = await User.findOne({ email }).select('+googleId +googleProfileToken +googleProfileTokenExpires');
      if (user && user.googleId && user.googleId !== payload.sub) {
        return res.status(409).json({ success: false, error: 'This email is already associated with another Google account.' });
      }
    }

    if (user?.status === 'inactive') return res.status(403).json({ success: false, error: 'This account has been deactivated' });

    if (!user) {
      user = new User({
        name: typeof payload.name === 'string' && payload.name.trim().length >= 2 ? payload.name.trim().slice(0, 120) : email.split('@')[0],
        email,
        googleId: payload.sub,
        emailVerified: true,
        onboardingStatus: 'google_profile_pending',
        role: 'student'
      });
    } else {
      user.googleId = payload.sub;
      user.emailVerified = true; // Google verified ownership of this address.
      if (user.onboardingStatus === 'email_verification_pending') user.onboardingStatus = 'complete';
    }

    if (user.onboardingStatus === 'google_profile_pending') {
      const registrationToken = crypto.randomBytes(32).toString('base64url');
      user.googleProfileToken = hashSecret(registrationToken);
      user.googleProfileTokenExpires = new Date(Date.now() + googleProfileLifetimeMs());
      await user.save();
      return res.status(200).json({
        success: true,
        requiresProfile: true,
        registrationToken,
        profile: { name: user.name, email: user.email }
      });
    }

    await user.save();
    return sendTokenResponse(user, 200, res);
  } catch (error) {
    if (error?.statusCode) return res.status(error.statusCode).json({ success: false, error: error.message });
    if (error?.code === 11000) return res.status(409).json({ success: false, error: 'This Google account is already linked to a different profile.' });
    return sendServerError(res, error, 'Unable to complete Google sign-in. Please try again later.');
  }
};

// @desc    Complete the local academic profile after a verified Google sign-in
// @route   POST /api/auth/google/complete-profile
// @access  Public, guarded by a short-lived one-time registration token
exports.completeGoogleProfile = async (req, res) => {
  try {
    const registrationToken = typeof req.body?.registrationToken === 'string' ? req.body.registrationToken.trim() : '';
    if (!registrationToken || registrationToken.length > 512) {
      return res.status(422).json({ success: false, error: 'Your Google registration session is invalid or expired. Continue with Google again.' });
    }
    const user = await User.findOne({
      googleProfileToken: hashSecret(registrationToken),
      googleProfileTokenExpires: { $gt: new Date() },
      onboardingStatus: 'google_profile_pending'
    }).select('+password +googleId +googleProfileToken +googleProfileTokenExpires');
    if (!user || !equalHashedSecret(user.googleProfileToken, hashSecret(registrationToken))) {
      return res.status(400).json({ success: false, error: 'Your Google registration session is invalid or expired. Continue with Google again.' });
    }
    if (user.status === 'inactive') return res.status(403).json({ success: false, error: 'This account has been deactivated' });

    if (req.body?.name !== undefined) user.name = requiredName(req.body.name);
    user.studentId = optionalText(req.body?.studentId, 'Student ID', 100);
    user.department = optionalText(req.body?.department, 'Department', 120);
    user.batch = optionalText(req.body?.batch, 'Batch', 100);
    const tenantProfile = await resolveRegistrationTenant({
      email: user.email,
      department: user.department,
      _institutionSlug: optionalText(req.body?.institutionSlug, 'Institution', 120),
      _departmentId: optionalText(req.body?.departmentId, 'Department', 80)
    });
    user.institution = tenantProfile.institution;
    user.departmentRef = tenantProfile.departmentRef || null;
    user.department = tenantProfile.department;
    if (req.body?.password !== undefined && req.body.password !== '') {
      const password = requiredPassword(req.body.password);
      passwordConfirmationMatches(password, req.body?.confirmPassword);
      user.password = password;
    }

    user.emailVerified = true;
    user.onboardingStatus = 'complete';
    user.googleProfileToken = undefined;
    user.googleProfileTokenExpires = undefined;
    await user.save();
    return sendTokenResponse(user, 201, res);
  } catch (error) {
    if (error?.statusCode) return res.status(error.statusCode).json({ success: false, error: error.message });
    return sendServerError(res, error, 'Unable to complete your Google profile. Please try again later.');
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return sendServerError(res, error, 'Unable to load your profile');
  }
};

// @desc Request a password-reset email
// @route POST /api/auth/forgot-password
// @access Public
exports.forgotPassword = async (req, res) => {
  try {
    const email = normaliseEmail(req.body?.email);
    const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');
    // Keep the response identical for unknown, unverified, and configured
    // accounts to avoid account enumeration.
    if (!user || !isReadyForAuthentication(user)) {
      return res.json({ success: true, message: 'If an account exists for this email, a reset link has been sent.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = hashSecret(rawToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const frontendOrigin = (process.env.FRONTEND_URL || '').split(',').map((value) => value.trim()).find(Boolean);
    if (!frontendOrigin) throw createHttpError('FRONTEND_URL is not configured', 503);
    const resetUrl = `${frontendOrigin.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
    try {
      await sendResetEmail({ email: user.email, name: user.name, resetUrl });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Password reset email failed:', error.message);
    }
    return res.json({ success: true, message: 'If an account exists for this email, a reset link has been sent.' });
  } catch (error) {
    // Keep this response generic even for malformed input: the endpoint is
    // deliberately resistant to account-discovery probes.
    if (error?.statusCode === 422) return res.status(422).json({ success: false, error: error.message });
    return sendServerError(res, error, 'Password reset is temporarily unavailable. Please try again later.');
  }
};

// @desc Set a password using a valid one-time reset token
// @route POST /api/auth/reset-password/:token
// @access Public
exports.resetPassword = async (req, res) => {
  try {
    const password = requiredPassword(req.body?.password);
    passwordConfirmationMatches(password, req.body?.confirmPassword);
    const rawToken = typeof req.params.token === 'string' ? req.params.token : '';
    if (!/^[a-f0-9]{64}$/i.test(rawToken)) {
      return res.status(400).json({ success: false, error: 'This password-reset link is invalid or has expired. Request a new one.' });
    }
    const token = hashSecret(rawToken);
    const user = await User.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: new Date() } }).select('+password +passwordResetToken +passwordResetExpires');
    if (!user || !isReadyForAuthentication(user)) {
      return res.status(400).json({ success: false, error: 'This password-reset link is invalid or has expired. Request a new one.' });
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    return sendTokenResponse(user, 200, res);
  } catch (error) {
    if (error?.statusCode) return res.status(error.statusCode).json({ success: false, error: error.message });
    return sendServerError(res, error, 'Unable to reset your password. Please try again later.');
  }
};
