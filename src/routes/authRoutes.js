const express = require("express");
const router = express.Router();
const validateRequest = require("../middleware/validateRequest");
const {
  register,
  login,
  logout,
  verifyToken,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  authValidation,
} = require("../controllers/authController");

router.post("/register", authValidation.register, validateRequest, register);
router.post("/login", authValidation.login, validateRequest, login);
router.post("/logout", logout); // If using cookies
router.post("/validate", refreshAccessToken); // If using refresh tokens
router.post(
  "/forgot-password",
  authValidation.forgotPassword,
  validateRequest,
  forgotPassword
);
router.post(
  "/reset-password/:token",
  authValidation.resetPassword,
  validateRequest,
  resetPassword
);

module.exports = router;
