// authController.js
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { body } = require("express-validator");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const {
  generateToken,
  generateRefreshToken,
} = require("../utils/generateToken");

const isProduction = process.env.NODE_ENV === 'production';


// Cookie options
const getCookieOptions = () => ({
  httpOnly: true, // Prevents JavaScript access
  secure: isProduction, // HTTPS only in production
  sameSite: isProduction ? "none" : "lax",
  maxAge: 15 * 60 * 1000, // 15 minutes for access token
  path: '/'
});

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
  path: '/'
});

const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: '/'
});

const register = async (req, res) => {

  const { name, partnerName, email, password } = req.body;

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
    partnerName,
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
      partnerName: user.partnerName,
      email: user.email,
      isActivated: user.isActivated,
      role: user.role,
    },
  });
};

const login = async (req, res) => {

  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(404).json({
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
      partnerName: user.partnerName,
      email: user.email,
      role: user.role,
      isActivated: user.isActivated,
    },
  });
};

const logout = async (req, res) => {
  res.clearCookie("accessToken", getClearCookieOptions());
  res.clearCookie("refreshToken", getClearCookieOptions());

  res.status(200).json({
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

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal the user exists or not for security
    return res.status(200).json({
      success: true,
      message: "If that email exists, a password reset link has been sent.",
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token and set to user
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire time (10 minutes)
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  // Email HTML template
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #4CAF50;">${resetUrl}</p>
          <p><strong>This link will expire in 10 minutes.</strong></p>
          <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Photo Gallery. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Request - Photo Gallery",
      html,
    });

    res.status(200).json({
      success: true,
      message: "Password reset email sent successfully.",
    });
  } catch (error) {
    console.error("Email send error:", error);

    // Clear reset token if email fails
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: "Email could not be sent. Please try again later.",
    });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash the token from URL to compare with stored hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Find user with valid token and not expired
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset token.",
    });
  }

  // Set new password
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
  user.password = await bcrypt.hash(password, saltRounds);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  // Optionally send confirmation email
  const confirmHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">Password Reset Successful</h2>
      <p>Hi ${user.name},</p>
      <p>Your password has been successfully reset.</p>
      <p>If you didn't make this change, please contact support immediately.</p>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Confirmation - Photo Gallery",
      html: confirmHtml,
    });
  } catch (error) {
    console.error("Confirmation email error:", error);
    // Don't fail the request if confirmation email fails
  }

  res.status(200).json({
    success: true,
    message:
      "Password reset successful. You can now login with your new password.",
  });
};

// Validation rules
const authValidation = {
  register: [
    body("name")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("partnerName")
      .isLength({ min: 2 })
      .withMessage("Partner name must be at least 2 characters"),
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
  forgotPassword: [
    body("email")
      .isEmail()
      .withMessage("Invalid email address")
      .normalizeEmail(),
  ],
  resetPassword: [
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
};

module.exports = {
  register,
  login,
  logout,
  verifyToken,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  authValidation,
};
