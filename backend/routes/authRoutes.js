const express = require('express');
const {
  register,
  requestVerification,
  resendVerification,
  verifyRegistration,
  login,
  adminLogin,
  googleAuthentication,
  completeGoogleProfile,
  getMe,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { getRegistrationOptions } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register/request-verification', requestVerification);
router.post('/register/resend-verification', resendVerification);
router.post('/register/verify', verifyRegistration);
router.post('/register', register);
router.get('/registration-options', getRegistrationOptions);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/google', googleAuthentication);
router.post('/google/complete-profile', completeGoogleProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
