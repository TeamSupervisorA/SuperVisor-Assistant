const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    // Token may be valid but the user could have been deleted
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
    }
    if (req.user.status === 'inactive') {
      return res.status(403).json({ success: false, error: 'This account has been deactivated' });
    }
    // A token must never grant access to a registration that has not finished
    // email verification or Google profile completion, even if a token was
    // somehow issued by an older deployment.
    if (req.user.emailVerified === false || (req.user.onboardingStatus && req.user.onboardingStatus !== 'complete')) {
      return res.status(403).json({ success: false, error: 'Complete account verification before accessing the workspace' });
    }
    if (req.user.passwordChangedAt && decoded.iat && decoded.iat < Math.floor(req.user.passwordChangedAt.getTime() / 1000)) {
      return res.status(401).json({ success: false, error: 'Your password was changed. Please sign in again.' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
