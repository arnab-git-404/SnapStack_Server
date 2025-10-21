const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getMe, getAllUsers } = require('../controllers/userController');

router.get('/me', protect, getMe);
router.get('/admin', protect, admin, getAllUsers); // admin-only list users

module.exports = router;
