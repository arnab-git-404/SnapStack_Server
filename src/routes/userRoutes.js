const express = require('express');
const multer = require("multer");
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getMe, uploadPhoto, getAllUserPhotos, getPhotosByCategory, clearAllRedisCache  } = require('../controllers/userController');

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
router.get('/photos' , protect, getAllUserPhotos);
router.get("/photos/:category", protect, getPhotosByCategory);
router.post('/upload-photo', protect, upload.single('photo'), uploadPhoto);
router.get('/clear-cache', protect, clearAllRedisCache);


// router.get('/admin', protect, admin, getAllUsers); // admin-only list users
// router.get('/admin', getAllUsers); // admin-only list users

module.exports = router;
