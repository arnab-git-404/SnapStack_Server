const express = require('express');
const multer = require("multer");
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getMe, getAllUsers, uploadPhoto, getPhotosByCategory, clearAllRedisCache  } = require('../controllers/userController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  },
});

router.get('/me', protect, getMe);
router.get('/admin', protect, admin, getAllUsers); // admin-only list users
router.post('/upload-photo', protect, upload.single('photo'), uploadPhoto);
router.get("/photos/:category", protect, getPhotosByCategory);
router.get('/clear-cache', protect, clearAllRedisCache);

module.exports = router;
