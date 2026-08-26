const express = require('express');
const {
  register,
  login,
  adminLogin,
  googleAuthentication,
  completeGoogleProfile,
  getMe,
  getPasswordRecoveryStatus,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { getRegistrationOptions } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.get('/registration-options', getRegistrationOptions);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/google', googleAuthentication);
router.post('/google/complete-profile', completeGoogleProfile);
router.get('/password-recovery/status', getPasswordRecoveryStatus);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
