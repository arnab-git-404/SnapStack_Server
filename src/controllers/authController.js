// authController.js
const bcrypt = require("bcryptjs");
const { body } = require("express-validator");
const User = require("../models/User");
const {
  generateToken,
  generateRefreshToken,
} = require("../utils/generateToken");

// Cookie options
const getCookieOptions = () => ({
  httpOnly: true, // Prevents JavaScript access
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "strict", // CSRF protection
  maxAge: 15 * 60 * 1000, // 15 minutes for access token
});

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
});

const register = async (req, res) => {

  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });

  if (existing) {
    return res.status(409).json({
      success: false,
      message: "Email already registered",
    });
  }

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  // Generate tokens
  const accessToken = generateToken({ id: user._id });
  const refreshToken = generateRefreshToken({ id: user._id });

  // Set cookies
  res.cookie("accessToken", accessToken, getCookieOptions());
  res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

  res.status(201).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

const login = async (req, res) => {

  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid Email",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid Password",
    });
  }

  // Generate tokens
  const accessToken = generateToken({ id: user._id });
  const refreshToken = generateRefreshToken({ id: user._id });

  // Set cookies
  res.cookie("accessToken", accessToken, getCookieOptions());
  res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

const logout = async (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

const verifyToken = async (req, res) => {

  const token = req.cookies.accessToken || req.cookies.refreshToken;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token not found",
    });
  }
  try {
    const { verifyToken } = require("../utils/generateToken");
    const decoded = verifyToken(token, false);
    res.status(200).json({
      success: true,
      message: "Token is valid",
      userId: decoded.userId || decoded.id,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid access token",
    });
  }
};

const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token not found",
    });
  }

  try {
    const { verifyToken } = require("../utils/generateToken");
    const decoded = verifyToken(refreshToken, true);

    // Generate new access token
    const newAccessToken = generateToken({ id: decoded.userId || decoded.id });

    res.cookie("accessToken", newAccessToken, getCookieOptions());

    res.json({
      success: true,
      message: "Token refreshed",
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

// Validation rules
const authValidation = {
  register: [
    body("name")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("email")
      .isEmail()
      .withMessage("Invalid email address")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  login: [
    body("email")
      .isEmail()
      .withMessage("Invalid email address")
      .normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
};

module.exports = {
  register,
  login,
  logout,
  verifyToken,
  refreshAccessToken,
  authValidation,
};
