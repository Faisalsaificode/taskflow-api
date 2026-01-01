const User = require('../models/User');
const { ApiError, asyncHandler, apiResponse } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('User with this email already exists');
  }

  const userRole = role === 'admin' ? 'admin' : 'user';

  const user = await User.create({
    name,
    email,
    password,
    role: userRole,
  });

  const token = user.generateAuthToken();

  logger.info(`New user registered: ${email} with role: ${userRole}`);

  apiResponse.created(res, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  }, 'User registered successfully');
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findByCredentials(email, password);

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = user.generateAuthToken();

  logger.info(`User logged in: ${email}`);

  apiResponse.success(res, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  }, 'Login successful');
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  apiResponse.success(res, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  if (email && email !== req.user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict('Email already in use');
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, email },
    { new: true, runValidators: true }
  );

  logger.info(`User profile updated: ${user.email}`);

  apiResponse.success(res, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  }, 'Profile updated successfully');
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.unauthorized('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  const token = user.generateAuthToken();

  logger.info(`Password changed for user: ${user.email}`);

  apiResponse.success(res, { token }, 'Password changed successfully');
});

const logout = asyncHandler(async (req, res) => {
  logger.info(`User logged out: ${req.user.email}`);
  apiResponse.success(res, null, 'Logged out successfully');
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
};