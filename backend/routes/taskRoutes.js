const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
  bulkUpdateStatus,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const {
  validate,
  createTaskValidation,
  updateTaskValidation,
  objectIdValidation,
  paginationValidation,
} = require('../middleware/validation');

router.use(protect);

router.get('/stats', getTaskStats);
router.patch('/bulk-status', bulkUpdateStatus);
router.get('/', paginationValidation, validate, getTasks);
router.post('/', createTaskValidation, validate, createTask);
router.get('/:id', objectIdValidation(), validate, getTask);
router.put('/:id', objectIdValidation(), updateTaskValidation, validate, updateTask);
router.delete('/:id', objectIdValidation(), validate, deleteTask);

module.exports = router;