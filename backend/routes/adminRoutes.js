const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getDashboardStats,
  deactivateUser,
  activateUser,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const {
  validate,
  objectIdValidation,
} = require('../middleware/validation');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/users/:id', objectIdValidation(), validate, getUser);
router.put('/users/:id', objectIdValidation(), validate, updateUser);
router.delete('/users/:id', objectIdValidation(), validate, deleteUser);
router.patch('/users/:id/deactivate', objectIdValidation(), validate, deactivateUser);
router.patch('/users/:id/activate', objectIdValidation(), validate, activateUser);

module.exports = router;