const User = require('../models/User');

// Get current user profile
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  const users = await User.find().select('-password');
  
  res.json({
    success: true,
    count: users.length,
    users
  });
};

module.exports = { getMe, getAllUsers };