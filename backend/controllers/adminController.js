const User = require('../models/User');
const Task = require('../models/Task');
const { ApiError, asyncHandler, apiResponse } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    order = 'desc',
    role,
    search,
    isActive,
  } = req.query;

  const query = {};

  if (role) {
    query.role = role;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const sortOrder = order === 'asc' ? 1 : -1;

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  apiResponse.paginated(
    res,
    users,
    {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    'Users retrieved successfully'
  );
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const taskStats = await Task.getStats(user._id);

  apiResponse.success(res, {
    user,
    taskStats,
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, isActive } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (req.params.id === req.user.id && isActive === false) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict('Email already in use');
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, role, isActive },
    { new: true, runValidators: true }
  );

  logger.info(`Admin ${req.user.email} updated user ${updatedUser.email}`);

  apiResponse.success(res, updatedUser, 'User updated successfully');
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (req.params.id === req.user.id) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  await Task.deleteMany({ user: req.params.id });
  await User.findByIdAndDelete(req.params.id);

  logger.info(`Admin ${req.user.email} deleted user ${user.email} and their tasks`);

  apiResponse.success(res, null, 'User and associated tasks deleted successfully');
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    adminCount,
    totalTasks,
    tasksByStatus,
    tasksByPriority,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'admin' }),
    Task.countDocuments(),
    Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt'),
  ]);

  const statusStats = tasksByStatus.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  const priorityStats = tasksByPriority.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  apiResponse.success(res, {
    users: {
      total: totalUsers,
      active: activeUsers,
      admins: adminCount,
      regularUsers: totalUsers - adminCount,
    },
    tasks: {
      total: totalTasks,
      byStatus: statusStats,
      byPriority: priorityStats,
    },
    recentUsers,
  });
});

const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (req.params.id === req.user.id) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  user.isActive = false;
  await user.save({ validateBeforeSave: false });

  logger.info(`Admin ${req.user.email} deactivated user ${user.email}`);

  apiResponse.success(res, null, 'User deactivated successfully');
});

const activateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  user.isActive = true;
  await user.save({ validateBeforeSave: false });

  logger.info(`Admin ${req.user.email} activated user ${user.email}`);

  apiResponse.success(res, null, 'User activated successfully');
});

module.exports = {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getDashboardStats,
  deactivateUser,
  activateUser,
};