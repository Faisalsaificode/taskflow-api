const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError, asyncHandler } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw ApiError.unauthorized('Access denied. No token provided.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'taskflow-api',
      audience: 'taskflow-client',
    });

    const user = await User.findById(decoded.id);

    if (!user) {
      throw ApiError.unauthorized('User belonging to this token no longer exists.');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('User account has been deactivated.');
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      throw ApiError.unauthorized('Password recently changed. Please log in again.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid token.');
    }
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token has expired. Please log in again.');
    }
    throw error;
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User not authenticated.'));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(
        `Unauthorized access attempt by user ${req.user.email} to ${req.originalUrl}`
      );
      return next(
        ApiError.forbidden(
          `Role '${req.user.role}' is not authorized to access this resource.`
        )
      );
    }

    next();
  };
};

const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    logger.debug('Optional auth token invalid or expired');
  }

  next();
});

module.exports = {
  protect,
  authorize,
  optionalAuth,
};