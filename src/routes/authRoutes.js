const express = require('express');
const router = express.Router();
const validateRequest = require('../middleware/validateRequest');
const { register, login, logout, verifyToken, refreshAccessToken, authValidation } = require('../controllers/authController');

router.post('/register', authValidation.register, validateRequest, register);
router.post('/login', authValidation.login, validateRequest, login);
router.post('/logout', logout); // If using cookies
router.get('/validate', refreshAccessToken); // If using refresh tokens

module.exports = router;



