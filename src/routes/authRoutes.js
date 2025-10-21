const express = require('express');
const router = express.Router();
const validateRequest = require('../middleware/validateRequest');
const { register, login, logout, refreshAccessToken, authValidation } = require('../controllers/authController');

router.post('/register', authValidation.register, validateRequest, register);
router.post('/login', authValidation.login, validateRequest, login);
router.post('/logout', logout); // If using cookies
router.post('/refresh', refreshAccessToken); // If using refresh tokens


module.exports = router;



