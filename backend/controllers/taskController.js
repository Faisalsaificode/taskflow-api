const Task = require('../models/Task');
const { ApiError, asyncHandler, apiResponse } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const getTasks = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    order = 'desc',
    status,
    priority,
    search,
    tag,
  } = req.query;

  const query = {};

  if (req.user.role !== 'admin') {
    query.user = req.user.id;
  } else if (req.query.userId) {
    query.user = req.query.userId;
  }

  if (status) {
    query.status = status;
  }

  if (priority) {
    query.priority = priority;
  }

  if (tag) {
    query.tags = { $in: [tag] };
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const sortOrder = order === 'asc' ? 1 : -1;

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .lean(),
    Task.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  apiResponse.paginated(
    res,
    tasks,
    {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    'Tasks retrieved successfully'
  );
});

const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('user', 'name email')
    .populate('createdBy', 'name email');

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  if (req.user.role !== 'admin' && task.user._id.toString() !== req.user.id) {
    throw ApiError.forbidden('You do not have permission to access this task');
  }

  apiResponse.success(res, task);
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, tags } = req.body;

  const taskUserId = req.user.role === 'admin' && req.body.userId
    ? req.body.userId
    : req.user.id;

  const task = await Task.create({
    title,
    description,
    status,
    priority,
    dueDate,
    tags,
    user: taskUserId,
    createdBy: req.user.id,
  });

  logger.info(`Task created: ${task._id} by user: ${req.user.email}`);

  apiResponse.created(res, task, 'Task created successfully');
});

const updateTask = asyncHandler(async (req, res) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  if (req.user.role !== 'admin' && task.user.toString() !== req.user.id) {
    throw ApiError.forbidden('You do not have permission to update this task');
  }

  const allowedUpdates = ['title', 'description', 'status', 'priority', 'dueDate', 'tags'];
  const updates = {};

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (req.user.role === 'admin' && req.body.userId) {
    updates.user = req.body.userId;
  }

  task = await Task.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate('user', 'name email');

  logger.info(`Task updated: ${task._id} by user: ${req.user.email}`);

  apiResponse.success(res, task, 'Task updated successfully');
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  if (req.user.role !== 'admin' && task.user.toString() !== req.user.id) {
    throw ApiError.forbidden('You do not have permission to delete this task');
  }

  await Task.findByIdAndDelete(req.params.id);

  logger.info(`Task deleted: ${req.params.id} by user: ${req.user.email}`);

  apiResponse.success(res, null, 'Task deleted successfully');
});

const getTaskStats = asyncHandler(async (req, res) => {
  const userId = req.user.role === 'admin' && req.query.userId
    ? req.query.userId
    : req.user.id;

  const stats = await Task.getStats(userId);

  const overdueCount = await Task.countDocuments({
    user: userId,
    status: { $nin: ['completed', 'cancelled'] },
    dueDate: { $lt: new Date() },
  });

  apiResponse.success(res, {
    ...stats,
    overdue: overdueCount,
  });
});

const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { taskIds, status } = req.body;

  if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
    throw ApiError.badRequest('Task IDs are required');
  }

  if (!['pending', 'in-progress', 'completed', 'cancelled'].includes(status)) {
    throw ApiError.badRequest('Invalid status value');
  }

  const query = { _id: { $in: taskIds } };
  if (req.user.role !== 'admin') {
    query.user = req.user.id;
  }

  const result = await Task.updateMany(query, { status });

  logger.info(`Bulk status update: ${result.modifiedCount} tasks updated by ${req.user.email}`);

  apiResponse.success(res, {
    modifiedCount: result.modifiedCount,
  }, `${result.modifiedCount} tasks updated successfully`);
});

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
  bulkUpdateStatus,
};